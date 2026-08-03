import { eq, lt, sql } from 'drizzle-orm'
import { db } from './db'
import { items, type Item, type NewItem } from './schema'

export async function getAllItems(): Promise<Item[]> {
  return db.select().from(items).orderBy(items.name)
}

export async function getShoppingList(): Promise<Item[]> {
  return db
    .select()
    .from(items)
    .where(lt(items.quantity, items.idealQuantity))
    .orderBy(items.name)
}

export async function createItem(
  data: Omit<NewItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Item> {
  const result = await db
    .insert(items)
    .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
    .returning()
  return result[0]
}

export async function updateItem(
  id: number,
  data: Partial<Omit<NewItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Item | null> {
  const result = await db
    .update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning()
  return result[0] ?? null
}

export async function deleteItem(id: number): Promise<boolean> {
  const result = await db
    .delete(items)
    .where(eq(items.id, id))
    .returning()
  return result.length > 0
}

export async function bulkUpdateQuantities(
  updates: Array<{ id: number; quantity: number }>
): Promise<Item[]> {
  const updated: Item[] = []
  for (const { id, quantity } of updates) {
    const result = await db
      .update(items)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning()
    if (result[0]) updated.push(result[0])
  }
  return updated
}
