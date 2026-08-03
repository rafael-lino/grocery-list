import type { ChatCompletionTool } from 'openai/resources'
import {
  getAllItems,
  getShoppingList,
  createItem,
  updateItem,
  deleteItem,
  bulkUpdateQuantities,
} from './repository'

// ─── Tool Definitions (OpenAI function-calling format) ───────────────────────

export const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_items',
      description:
        'Returns all grocery items stored at home, with their current quantity and ideal quantity.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_shopping_list',
      description:
        'Returns items where the current quantity is below the ideal quantity — i.e. what needs to be bought.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_item',
      description: 'Creates a new grocery item.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Item name, e.g. "Rice"' },
          type: {
            type: 'string',
            description: 'Unit type, e.g. "kg", "unit", "package", "liter"',
          },
          quantity: {
            type: 'number',
            description: 'Current quantity at home',
          },
          idealQuantity: {
            type: 'number',
            description: 'Desired quantity to keep stocked',
          },
        },
        required: ['name', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_item',
      description: 'Updates one or more fields of an existing item by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Item ID' },
          name: { type: 'string' },
          type: { type: 'string' },
          quantity: { type: 'number' },
          idealQuantity: { type: 'number' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_item',
      description: 'Deletes an item from the grocery list by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Item ID to delete' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bulk_update_quantities',
      description:
        'Updates quantities for multiple items at once — useful after a shopping trip.',
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                quantity: { type: 'number' },
              },
              required: ['id', 'quantity'],
            },
          },
        },
        required: ['updates'],
      },
    },
  },
]

// ─── Tool Handler ─────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'list_items':
      return getAllItems()

    case 'get_shopping_list':
      return getShoppingList()

    case 'create_item':
      return createItem({
        name: args.name as string,
        type: args.type as string,
        quantity: (args.quantity as number) ?? 0,
        idealQuantity: (args.idealQuantity as number) ?? 1,
      })

    case 'update_item': {
      const { id, ...rest } = args
      return updateItem(id as number, rest as Parameters<typeof updateItem>[1])
    }

    case 'delete_item':
      return deleteItem(args.id as number)

    case 'bulk_update_quantities':
      return bulkUpdateQuantities(
        args.updates as Array<{ id: number; quantity: number }>
      )

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
