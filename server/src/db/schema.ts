import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const trees = pgTable('trees', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  surname: text('surname').notNull(),
  members: integer('members').notNull().default(0),
  privacy: text('privacy').notNull().default('private'),
  lastUpdated: timestamp('last_updated', { withTimezone: false }).notNull().defaultNow(),
})

export const treePersons = pgTable('tree_persons', {
  id: text('id').primaryKey(),
  treeId: text('tree_id').notNull(),
  label: text('label').notNull(),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  years: text('years').notNull().default(''),
  place: text('place').notNull().default(''),
  branch: text('branch').notNull().default(''),
  note: text('note').notNull().default(''),
  aliases: text('aliases').notNull().default(''),
  sources: text('sources').notNull().default(''),
  researchStatus: text('research_status').notNull().default('confirmed'),
  accent: text('accent').notNull().default('blue'),
  panelColor: text('panel_color').notNull().default(''),
  textColor: text('text_color').notNull().default(''),
  x: integer('x').notNull().default(0),
  y: integer('y').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
})

export const treeRelationships = pgTable('tree_relationships', {
  id: text('id').primaryKey(),
  treeId: text('tree_id').notNull(),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  kind: text('kind').notNull(),
  note: text('note').notNull().default(''),
  researchStatus: text('research_status').notNull().default('confirmed'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
})

export type TreeRow = typeof trees.$inferSelect
export type TreePersonRow = typeof treePersons.$inferSelect
export type TreeRelationshipRow = typeof treeRelationships.$inferSelect
