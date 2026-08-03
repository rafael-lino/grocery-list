import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources'
import { tools, executeTool } from '@/lib/tools'

const SYSTEM_PROMPT = `You are a helpful grocery assistant. You help the user manage their home grocery inventory.

You have access to tools to read and update a grocery database. When the user asks about their groceries, use the appropriate tool to get fresh data before responding.

Guidelines:
- Always use tools to read current data — never make up quantities
- When updating quantities after shopping, confirm which items were updated
- Be concise and friendly
- Present lists in a readable format with emojis for visual clarity (e.g. 🛒 for shopping list, 📦 for inventory)
- If an item is not found by name, list available items and ask for clarification`

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

    // Agentic loop — keep running until no more tool calls
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

    const reply = response.choices[0].message.content
    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
