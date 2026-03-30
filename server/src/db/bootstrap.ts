import { count, eq } from 'drizzle-orm'

import { syncLadyzhenkoResearchTree, ladyzhenkoLegacyPersonIds, ladyzhenkoResearchPersons } from './ladyzhenkoResearchData.js'
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
      aliases text NOT NULL DEFAULT '',
      sources text NOT NULL DEFAULT '',
      research_status text NOT NULL DEFAULT 'confirmed',
      accent text NOT NULL DEFAULT 'blue',
      panel_color text NOT NULL DEFAULT '',
      text_color text NOT NULL DEFAULT '',
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
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS aliases text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS sources text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS research_status text NOT NULL DEFAULT 'confirmed';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS panel_color text NOT NULL DEFAULT '';
    ALTER TABLE tree_persons ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '';
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tree_relationships (
      id text PRIMARY KEY,
      tree_id text NOT NULL,
      source_id text NOT NULL,
      target_id text NOT NULL,
      kind text NOT NULL,
      note text NOT NULL DEFAULT '',
      research_status text NOT NULL DEFAULT 'confirmed',
      created_at timestamp NOT NULL DEFAULT now()
    );
  `)

  await pool.query(`
    ALTER TABLE tree_relationships ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';
    ALTER TABLE tree_relationships ADD COLUMN IF NOT EXISTS research_status text NOT NULL DEFAULT 'confirmed';
  `)

  const [{ value: total }] = await db.select({ value: count() }).from(trees)

  if (total === 0) {
    await db.insert(trees).values([
      {
        id: 'ladyzhenko-family',
        title: 'Род Ладыженко',
        surname: 'Ладыженко',
        members: ladyzhenkoResearchPersons.length,
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
    await syncLadyzhenkoResearchTree()
  }

  const existingLadyzhenkoPersons = await db
    .select({ id: treePersons.id })
    .from(treePersons)
    .where(eq(treePersons.treeId, 'ladyzhenko-family'))

  const shouldReplaceLegacyLadyzhenkoTree =
    existingLadyzhenkoPersons.length === 0 || existingLadyzhenkoPersons.some((person) => ladyzhenkoLegacyPersonIds.has(person.id))

  if (shouldReplaceLegacyLadyzhenkoTree) {
    await syncLadyzhenkoResearchTree()
  }

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
