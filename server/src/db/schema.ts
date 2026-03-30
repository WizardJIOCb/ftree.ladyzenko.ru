import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const trees = pgTable('trees', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  surname: text('surname').notNull(),
  members: integer('members').notNull().default(0),
  privacy: text('privacy').notNull().default('private'),
  lastUpdated: timestamp('last_updated', { withTimezone: false }).notNull().defaultNow(),
})

export type TreeRow = typeof trees.$inferSelect
