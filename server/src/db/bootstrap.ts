import { count } from 'drizzle-orm'

import { db, pool } from './index.js'
import { treePersons, treeRelationships, trees } from './schema.js'

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tree_persons (
      id text PRIMARY KEY,
      tree_id text NOT NULL,
      label text NOT NULL,
      accent text NOT NULL DEFAULT 'blue',
      x integer NOT NULL DEFAULT 0,
      y integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tree_relationships (
      id text PRIMARY KEY,
      tree_id text NOT NULL,
      source_id text NOT NULL,
      target_id text NOT NULL,
      kind text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `)

  const [{ value: total }] = await db.select({ value: count() }).from(trees)

  if (total === 0) {
    await db.insert(trees).values([
      {
        id: 'ladyzhenko-family',
        title: 'Род Ладыженко',
        surname: 'Ладыженко',
        members: 4,
        privacy: 'private',
      },
      {
        id: 'siberian-branch',
        title: 'Сибирская ветка',
        surname: 'Георгиевы',
        members: 0,
        privacy: 'shared',
      },
      {
        id: 'public-archive',
        title: 'Публичный архив семьи',
        surname: 'Домбровские',
        members: 0,
        privacy: 'public',
      },
    ])
  }

  const [{ value: personTotal }] = await db.select({ value: count() }).from(treePersons)

  if (personTotal > 0) {
    await pool.query(`
      UPDATE trees
      SET members = COALESCE(
        (
          SELECT COUNT(*)
          FROM tree_persons
          WHERE tree_persons.tree_id = trees.id
        ),
        0
      );
    `)
    return
  }

  await db.insert(treePersons).values([
    {
      id: 'lady-left',
      treeId: 'ladyzhenko-family',
      label: 'Иван Ладыженко',
      accent: 'blue',
      x: 390,
      y: 430,
    },
    {
      id: 'lady-top',
      treeId: 'ladyzhenko-family',
      label: 'Пётр Ладыженко',
      accent: 'blue',
      x: 528,
      y: 430,
    },
    {
      id: 'lady-right',
      treeId: 'ladyzhenko-family',
      label: 'Анна Ладыженко',
      accent: 'slate',
      x: 720,
      y: 430,
    },
    {
      id: 'lady-bottom',
      treeId: 'ladyzhenko-family',
      label: 'Мария Ладыженко',
      accent: 'pink',
      x: 560,
      y: 590,
    },
  ])

  await db.insert(treeRelationships).values([
    {
      id: 'rel-vertical',
      treeId: 'ladyzhenko-family',
      sourceId: 'lady-top',
      targetId: 'lady-bottom',
      kind: 'parent-child',
    },
    {
      id: 'rel-angled',
      treeId: 'ladyzhenko-family',
      sourceId: 'lady-right',
      targetId: 'lady-bottom',
      kind: 'parent-child',
    },
  ])

  await pool.query(`
    UPDATE trees
    SET members = COALESCE(
      (
        SELECT COUNT(*)
        FROM tree_persons
        WHERE tree_persons.tree_id = trees.id
      ),
      0
    );
  `)
}
