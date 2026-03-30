import { count } from 'drizzle-orm'

import { db, pool } from './index.js'
import { trees } from './schema.js'

export async function bootstrapDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trees (
      id text PRIMARY KEY,
      title text NOT NULL,
      surname text NOT NULL,
      members integer NOT NULL DEFAULT 0,
      privacy text NOT NULL DEFAULT 'private',
      last_updated timestamp NOT NULL DEFAULT now()
    );
  `)

  const [{ value: total }] = await db.select({ value: count() }).from(trees)

  if (total > 0) {
    return
  }

  await db.insert(trees).values([
    {
      id: 'ladyzhenko-family',
      title: 'Род Ладыженко',
      surname: 'Ладыженко',
      members: 24,
      privacy: 'private',
    },
    {
      id: 'siberian-branch',
      title: 'Сибирская ветка',
      surname: 'Георгиевы',
      members: 13,
      privacy: 'shared',
    },
    {
      id: 'public-archive',
      title: 'Публичный архив семьи',
      surname: 'Домбровские',
      members: 51,
      privacy: 'public',
    },
  ])
}
