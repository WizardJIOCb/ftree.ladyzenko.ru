import { and, desc, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db } from '../db/index.js'
import { treePersons, treeRelationships, trees } from '../db/schema.js'

const createTreeSchema = z.object({
  title: z.string().min(2),
  surname: z.string().min(2),
  privacy: z.enum(['private', 'shared', 'public']).default('private'),
})

const treeParamsSchema = z.object({
  treeId: z.string().min(1),
})

const personParamsSchema = z.object({
  treeId: z.string().min(1),
  personId: z.string().min(1),
})

const createPersonSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  accent: z.enum(['blue', 'pink', 'slate']).optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
})

const updatePersonSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  accent: z.enum(['blue', 'pink', 'slate']).optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
})

const layoutSchema = z.object({
  persons: z.array(
    z.object({
      id: z.string().min(1),
      x: z.number().int(),
      y: z.number().int(),
    }),
  ),
})

function mapTree(tree: typeof trees.$inferSelect) {
  return {
    id: tree.id,
    title: tree.title,
    surname: tree.surname,
    members: tree.members,
    privacy: tree.privacy as 'private' | 'shared' | 'public',
    lastUpdated: new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(tree.lastUpdated),
  }
}

function mapPerson(person: typeof treePersons.$inferSelect) {
  return {
    id: person.id,
    label: person.label,
    accent: person.accent as 'blue' | 'pink' | 'slate',
    x: person.x,
    y: person.y,
  }
}

function mapRelationship(relationship: typeof treeRelationships.$inferSelect) {
  return {
    id: relationship.id,
    source: relationship.sourceId,
    target: relationship.targetId,
    kind: relationship.kind as 'parent-child' | 'partner',
  }
}

export async function registerTreeRoutes(app: FastifyInstance) {
  app.get('/api/trees', async () => {
    const rows = await db.select().from(trees).orderBy(desc(trees.lastUpdated))
    return rows.map(mapTree)
  })

  app.post('/api/trees', async (request, reply) => {
    const parsed = createTreeSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid payload' })
    }

    const payload = parsed.data
    const [created] = await db
      .insert(trees)
      .values({
        id: crypto.randomUUID(),
        title: payload.title,
        surname: payload.surname,
        privacy: payload.privacy,
        members: 0,
      })
      .returning()

    return reply.code(201).send(mapTree(created))
  })

  app.get('/api/trees/:treeId/editor', async (request, reply) => {
    const parsed = treeParamsSchema.safeParse(request.params)

    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid tree id' })
    }

    const [tree] = await db.select().from(trees).where(eq(trees.id, parsed.data.treeId)).limit(1)

    if (!tree) {
      return reply.code(404).send({ ok: false, error: 'Tree not found' })
    }

    const persons = await db
      .select()
      .from(treePersons)
      .where(eq(treePersons.treeId, parsed.data.treeId))
      .orderBy(treePersons.createdAt)
    const relationships = await db
      .select()
      .from(treeRelationships)
      .where(eq(treeRelationships.treeId, parsed.data.treeId))
      .orderBy(treeRelationships.createdAt)

    return {
      tree: mapTree(tree),
      persons: persons.map(mapPerson),
      relationships: relationships.map(mapRelationship),
    }
  })

  app.post('/api/trees/:treeId/persons', async (request, reply) => {
    const params = treeParamsSchema.safeParse(request.params)
    const body = createPersonSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid payload' })
    }

    const [tree] = await db.select().from(trees).where(eq(trees.id, params.data.treeId)).limit(1)

    if (!tree) {
      return reply.code(404).send({ ok: false, error: 'Tree not found' })
    }

    const accents: Array<'blue' | 'pink' | 'slate'> = ['blue', 'pink', 'slate']
    const [created] = await db
      .insert(treePersons)
      .values({
        id: crypto.randomUUID(),
        treeId: params.data.treeId,
        label: body.data.label ?? `Персона ${tree.members + 1}`,
        accent: body.data.accent ?? accents[tree.members % accents.length],
        x: body.data.x ?? 420 + (tree.members % 2) * 180,
        y: body.data.y ?? 300 + Math.floor(tree.members / 2) * 120,
      })
      .returning()

    await db
      .update(trees)
      .set({
        members: sql`${trees.members} + 1`,
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, params.data.treeId))

    return reply.code(201).send(mapPerson(created))
  })

  app.patch('/api/trees/:treeId/persons/:personId', async (request, reply) => {
    const params = personParamsSchema.safeParse(request.params)
    const body = updatePersonSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid payload' })
    }

    const updates = Object.fromEntries(
      Object.entries(body.data).filter(([, value]) => value !== undefined),
    )

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ ok: false, error: 'Nothing to update' })
    }

    const [updated] = await db
      .update(treePersons)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(treePersons.treeId, params.data.treeId), eq(treePersons.id, params.data.personId)))
      .returning()

    if (!updated) {
      return reply.code(404).send({ ok: false, error: 'Person not found' })
    }

    await db
      .update(trees)
      .set({
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, params.data.treeId))

    return mapPerson(updated)
  })

  app.post('/api/trees/:treeId/layout', async (request, reply) => {
    const params = treeParamsSchema.safeParse(request.params)
    const body = layoutSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid payload' })
    }

    if (body.data.persons.length === 0) {
      return { ok: true }
    }

    for (const person of body.data.persons) {
      await db
        .update(treePersons)
        .set({
          x: person.x,
          y: person.y,
          updatedAt: new Date(),
        })
        .where(and(eq(treePersons.treeId, params.data.treeId), eq(treePersons.id, person.id)))
        .returning({ id: treePersons.id })
    }

    await db
      .update(trees)
      .set({
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, params.data.treeId))

    return { ok: true }
  })
}
