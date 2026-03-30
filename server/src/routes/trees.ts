import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db } from '../db/index.js'
import { treePersons, treeRelationships, trees } from '../db/schema.js'

const treePrivacySchema = z.enum(['private', 'shared', 'public'])
const accentSchema = z.enum(['blue', 'pink', 'slate'])

const createTreeSchema = z.object({
  title: z.string().trim().min(2),
  surname: z.string().trim().min(2),
  privacy: treePrivacySchema.default('private'),
})

const updateTreeSchema = z.object({
  title: z.string().trim().min(2).optional(),
  surname: z.string().trim().min(2).optional(),
  privacy: treePrivacySchema.optional(),
})

const treeParamsSchema = z.object({
  treeId: z.string().min(1),
})

const personParamsSchema = z.object({
  treeId: z.string().min(1),
  personId: z.string().min(1),
})

const createPersonSchema = z.object({
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  years: z.string().trim().max(60).optional(),
  place: z.string().trim().max(120).optional(),
  branch: z.string().trim().max(120).optional(),
  note: z.string().trim().max(2000).optional(),
  accent: accentSchema.optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
})

const updatePersonSchema = z.object({
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
  years: z.string().trim().max(60).optional(),
  place: z.string().trim().max(120).optional(),
  branch: z.string().trim().max(120).optional(),
  note: z.string().trim().max(2000).optional(),
  accent: accentSchema.optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
})

const createRelationshipSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  kind: z.enum(['parent-child', 'partner']),
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

function buildPersonLabel(firstName: string, lastName: string, fallback: string) {
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || fallback
}

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
    label: buildPersonLabel(person.firstName, person.lastName, person.label),
    firstName: person.firstName,
    lastName: person.lastName,
    years: person.years,
    place: person.place,
    branch: person.branch,
    note: person.note,
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

  app.patch('/api/trees/:treeId', async (request, reply) => {
    const params = treeParamsSchema.safeParse(request.params)
    const body = updateTreeSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid payload' })
    }

    const updates = Object.fromEntries(Object.entries(body.data).filter(([, value]) => value !== undefined))

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ ok: false, error: 'Nothing to update' })
    }

    const [updated] = await db
      .update(trees)
      .set({
        ...updates,
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, params.data.treeId))
      .returning()

    if (!updated) {
      return reply.code(404).send({ ok: false, error: 'Tree not found' })
    }

    return mapTree(updated)
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

    const nextIndex = tree.members + 1
    const firstName = body.data.firstName ?? 'Новая'
    const lastName = body.data.lastName ?? `персона ${nextIndex}`
    const label = buildPersonLabel(firstName, lastName, `Персона ${nextIndex}`)
    const accents: Array<'blue' | 'pink' | 'slate'> = ['blue', 'pink', 'slate']

    const [created] = await db
      .insert(treePersons)
      .values({
        id: crypto.randomUUID(),
        treeId: params.data.treeId,
        label,
        firstName,
        lastName,
        years: body.data.years ?? '',
        place: body.data.place ?? '',
        branch: body.data.branch ?? tree.surname,
        note: body.data.note ?? '',
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

    const updates = Object.fromEntries(Object.entries(body.data).filter(([, value]) => value !== undefined))

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ ok: false, error: 'Nothing to update' })
    }

    const [current] = await db
      .select()
      .from(treePersons)
      .where(and(eq(treePersons.treeId, params.data.treeId), eq(treePersons.id, params.data.personId)))
      .limit(1)

    if (!current) {
      return reply.code(404).send({ ok: false, error: 'Person not found' })
    }

    const firstName = typeof updates.firstName === 'string' ? updates.firstName : current.firstName
    const lastName = typeof updates.lastName === 'string' ? updates.lastName : current.lastName
    const label = buildPersonLabel(firstName, lastName, current.label)

    const [updated] = await db
      .update(treePersons)
      .set({
        ...updates,
        label,
        updatedAt: new Date(),
      })
      .where(and(eq(treePersons.treeId, params.data.treeId), eq(treePersons.id, params.data.personId)))
      .returning()

    await db
      .update(trees)
      .set({
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, params.data.treeId))

    return mapPerson(updated)
  })

  app.delete('/api/trees/:treeId/persons/:personId', async (request, reply) => {
    const params = personParamsSchema.safeParse(request.params)

    if (!params.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid payload' })
    }

    const [person] = await db
      .select()
      .from(treePersons)
      .where(and(eq(treePersons.treeId, params.data.treeId), eq(treePersons.id, params.data.personId)))
      .limit(1)

    if (!person) {
      return reply.code(404).send({ ok: false, error: 'Person not found' })
    }

    await db
      .delete(treeRelationships)
      .where(
        and(
          eq(treeRelationships.treeId, params.data.treeId),
          or(eq(treeRelationships.sourceId, params.data.personId), eq(treeRelationships.targetId, params.data.personId)),
        ),
      )

    await db
      .delete(treePersons)
      .where(and(eq(treePersons.treeId, params.data.treeId), eq(treePersons.id, params.data.personId)))

    await db
      .update(trees)
      .set({
        members: sql`GREATEST(${trees.members} - 1, 0)`,
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, params.data.treeId))

    return { ok: true }
  })

  app.post('/api/trees/:treeId/relationships', async (request, reply) => {
    const params = treeParamsSchema.safeParse(request.params)
    const body = createRelationshipSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({ ok: false, error: 'Invalid payload' })
    }

    if (body.data.sourceId === body.data.targetId) {
      return reply.code(400).send({ ok: false, error: 'Relationship requires two different persons' })
    }

    const people = await db
      .select({ id: treePersons.id })
      .from(treePersons)
      .where(and(eq(treePersons.treeId, params.data.treeId), inArray(treePersons.id, [body.data.sourceId, body.data.targetId])))

    if (people.length !== 2) {
      return reply.code(404).send({ ok: false, error: 'Person not found' })
    }

    const duplicateCondition =
      body.data.kind === 'partner'
        ? or(
            and(eq(treeRelationships.sourceId, body.data.sourceId), eq(treeRelationships.targetId, body.data.targetId)),
            and(eq(treeRelationships.sourceId, body.data.targetId), eq(treeRelationships.targetId, body.data.sourceId)),
          )
        : and(eq(treeRelationships.sourceId, body.data.sourceId), eq(treeRelationships.targetId, body.data.targetId))

    const [existing] = await db
      .select()
      .from(treeRelationships)
      .where(and(eq(treeRelationships.treeId, params.data.treeId), eq(treeRelationships.kind, body.data.kind), duplicateCondition))
      .limit(1)

    if (existing) {
      return reply.code(409).send({ ok: false, error: 'Relationship already exists' })
    }

    const [created] = await db
      .insert(treeRelationships)
      .values({
        id: crypto.randomUUID(),
        treeId: params.data.treeId,
        sourceId: body.data.sourceId,
        targetId: body.data.targetId,
        kind: body.data.kind,
      })
      .returning()

    await db
      .update(trees)
      .set({
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, params.data.treeId))

    return reply.code(201).send(mapRelationship(created))
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
