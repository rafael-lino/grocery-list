import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources'
import { tools, executeTool } from '@/lib/tools'

const SYSTEM_PROMPT = `You are a helpful grocery assistant. You help the user manage their home grocery inventory.

You have access to tools to read and update a grocery database. When the user asks about their groceries, use the appropriate tool to get fresh data before responding.

## Response formatting rules — follow these exactly:

- Always respond in Markdown
- When presenting multiple items (inventory, shopping list, or any list of results), always use a Markdown table with columns: Name | Quantity | Ideal | Unit
- When confirming a single action (item added, updated, or deleted), use a short bullet list
- Never mention item IDs — they are internal and must never appear in your responses
- Use emojis sparingly and only where they add clarity (e.g. 🛒 for shopping list header)
- Be concise and friendly

## Table format to use for item lists:

| Name | Quantity | Ideal | Unit |
|------|----------|-------|------|
| Rice | 1 | 2 | kg |

## Guidelines:
- Always use tools to read current data — never make up quantities
- If an item is not found by name, list available items and ask for clarification
- After a bulk update, confirm with a table showing the new quantities`

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    const baseURL = req.headers.get('x-base-url') || 'https://api.openai.com/v1'
    const model = req.headers.get('x-model') || 'gpt-4o-mini'

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured. Please add your API key in Settings.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages } = (await req.json()) as {
      messages: ChatCompletionMessageParam[]
    }

    const client = new OpenAI({ apiKey, baseURL })

    const allMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    // Agentic loop — non-streaming until all tool calls are resolved
    let response = await client.chat.completions.create({
      model,
      messages: allMessages,
      tools,
      tool_choice: 'auto',
    })

    while (response.choices[0].finish_reason === 'tool_calls') {
      const assistantMessage = response.choices[0].message
      allMessages.push(assistantMessage)

      for (const toolCall of assistantMessage.tool_calls!) {
        const args = JSON.parse(toolCall.function.arguments)
        let result: unknown
        try {
          result = await executeTool(toolCall.function.name, args)
        } catch (err) {
          result = { error: String(err) }
        }
        allMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }

      response = await client.chat.completions.create({
        model,
        messages: allMessages,
        tools,
        tool_choice: 'auto',
      })
    }

    // Re-use the final message if already complete, otherwise stream it.
    // This avoids a redundant LLM call when the loop exits with a text reply
    // (e.g. no tools were needed). We only stream when the content is absent,
    // which happens when the last loop iteration itself was a tool call round
    // that produced a non-tool final response with empty content (rare but
    // possible). In practice, checking finish_reason is the reliable signal.
    const finalContent = response.choices[0].message.content
    if (finalContent) {
      // Already have the full reply — stream it locally to keep the same
      // client-side flow without an extra round-trip.
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(finalContent))
          controller.close()
        },
      })
      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // No content yet — ask the model to stream the final reply
    const streamResponse = await client.chat.completions.create({
      model,
      messages: allMessages,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            const token = chunk.choices[0]?.delta?.content
            if (token) controller.enqueue(encoder.encode(token))
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
