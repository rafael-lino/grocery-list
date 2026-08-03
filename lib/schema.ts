import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull().default('unit'), // kg, unit, package, liter, etc.
  quantity: real('quantity').notNull().default(0),
  idealQuantity: real('ideal_quantity').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
