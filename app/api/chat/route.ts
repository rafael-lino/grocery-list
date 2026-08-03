import { NextRequest, NextResponse } from 'next/server'
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

const INTERNAL_FIELDS = new Set(['id', 'createdAt', 'updatedAt'])

function sanitizeToolResult(result: unknown): unknown {
  if (Array.isArray(result)) return result.map(sanitizeToolResult)
  if (result !== null && typeof result === 'object') {
    return Object.fromEntries(
      Object.entries(result as Record<string, unknown>)
        .filter(([k]) => !INTERNAL_FIELDS.has(k))
        .map(([k, v]) => [k, sanitizeToolResult(v)])
    )
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    const baseURL = req.headers.get('x-base-url') || 'https://api.openai.com/v1'
    const model = req.headers.get('x-model') || 'gpt-4o-mini'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please add your API key in Settings.' },
        { status: 401 }
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

    let response = await client.chat.completions.create({
      model,
      messages: allMessages,
      tools,
      tool_choice: 'auto',
    })

    while (response.choices[0].finish_reason === 'tool_calls') {
      const assistantMessage = response.choices[0].message
      allMessages.push(assistantMessage)

      const toolCalls = assistantMessage.tool_calls!
      for (const toolCall of toolCalls) {
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
          content: JSON.stringify(sanitizeToolResult(result)),
        })
      }

      response = await client.chat.completions.create({
        model,
        messages: allMessages,
        tools,
        tool_choice: 'auto',
      })
    }

    const reply = response.choices[0].message.content
    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
