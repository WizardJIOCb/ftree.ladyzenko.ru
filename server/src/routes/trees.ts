import { desc } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { db } from '../db/index.js'
import { trees } from '../db/schema.js'

const createTreeSchema = z.object({
  title: z.string().min(2),
  surname: z.string().min(2),
  privacy: z.enum(['private', 'shared', 'public']).default('private'),
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
}
