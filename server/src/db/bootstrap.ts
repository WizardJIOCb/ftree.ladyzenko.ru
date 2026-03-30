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
      first_name text NOT NULL DEFAULT '',
      last_name text NOT NULL DEFAULT '',
      years text NOT NULL DEFAULT '',
      place text NOT NULL DEFAULT '',
      branch text NOT NULL DEFAULT '',
      note text NOT NULL DEFAULT '',
      accent text NOT NULL DEFAULT 'blue',
      x integer NOT NULL DEFAULT 0,
      y integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `)

  await pool.query(`
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS years text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS place text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS branch text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';
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

  if (personTotal === 0) {
    await db.insert(treePersons).values([
      {
        id: 'lady-left',
        treeId: 'ladyzhenko-family',
        label: 'Иван Ладыженко',
        firstName: 'Иван',
        lastName: 'Ладыженко',
        years: '1908-1981',
        place: 'Тобольск',
        branch: 'Северная линия',
        note: 'Старшая ветвь рода. Карточка хранит короткую биографическую справку.',
        accent: 'blue',
        x: 390,
        y: 430,
      },
      {
        id: 'lady-top',
        treeId: 'ladyzhenko-family',
        label: 'Пётр Ладыженко',
        firstName: 'Пётр',
        lastName: 'Ладыженко',
        years: '1910-1988',
        place: 'Тюмень',
        branch: 'Северная линия',
        note: 'Один из ключевых представителей семьи, от которого удобно разворачивать ветку.',
        accent: 'blue',
        x: 528,
        y: 430,
      },
      {
        id: 'lady-right',
        treeId: 'ladyzhenko-family',
        label: 'Анна Ладыженко',
        firstName: 'Анна',
        lastName: 'Ладыженко',
        years: '1916-1994',
        place: 'Омск',
        branch: 'Материнская линия',
        note: 'Связывает соседнюю ветку и добавляет контекст для потомков.',
        accent: 'slate',
        x: 720,
        y: 430,
      },
      {
        id: 'lady-bottom',
        treeId: 'ladyzhenko-family',
        label: 'Мария Ладыженко',
        firstName: 'Мария',
        lastName: 'Ладыженко',
        years: '1941-2012',
        place: 'Екатеринбург',
        branch: 'Младшая линия',
        note: 'Потомок центральной ветки, на которой удобно показывать родительские связи.',
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
  }

  await pool.query(`
    UPDATE tree_persons
    SET first_name = 'Иван', last_name = 'Ладыженко', years = '1908-1981', place = 'Тобольск', branch = 'Северная линия',
        note = 'Старшая ветвь рода. Карточка хранит короткую биографическую справку.', label = 'Иван Ладыженко'
    WHERE id = 'lady-left' AND first_name = '';

    UPDATE tree_persons
    SET first_name = 'Пётр', last_name = 'Ладыженко', years = '1910-1988', place = 'Тюмень', branch = 'Северная линия',
        note = 'Один из ключевых представителей семьи, от которого удобно разворачивать ветку.', label = 'Пётр Ладыженко'
    WHERE id = 'lady-top' AND first_name = '';

    UPDATE tree_persons
    SET first_name = 'Анна', last_name = 'Ладыженко', years = '1916-1994', place = 'Омск', branch = 'Материнская линия',
        note = 'Связывает соседнюю ветку и добавляет контекст для потомков.', label = 'Анна Ладыженко'
    WHERE id = 'lady-right' AND first_name = '';

    UPDATE tree_persons
    SET first_name = 'Мария', last_name = 'Ладыженко', years = '1941-2012', place = 'Екатеринбург', branch = 'Младшая линия',
        note = 'Потомок центральной ветки, на которой удобно показывать родительские связи.', label = 'Мария Ладыженко'
    WHERE id = 'lady-bottom' AND first_name = '';
  `)

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
