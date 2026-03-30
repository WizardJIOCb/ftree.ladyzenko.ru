import { count, eq } from 'drizzle-orm'

import { db, pool } from './index.js'
import { treePersons, treeRelationships, trees } from './schema.js'

const ladyzhenkoResearchPersons: Array<typeof treePersons.$inferInsert> = [
  {
    id: 'pavel-ivanovich-ladyzhenko',
    treeId: 'ladyzhenko-family',
    label: 'Павел Иванович Ладыженко',
    firstName: 'Павел',
    lastName: 'Ладыженко',
    years: 'ок. 1894-1895',
    place: 'с. Скородное, Ельский район, Гомельская область',
    branch: 'Отцовская линия Ладыженко',
    note: 'Отец Ивана Павловича. В чате фигурирует как подтвержденный родитель, но точные даты рождения и брака еще нужно добрать архивно.',
    aliases: 'Ладыженко; Лодиженко; Лодыженко; Ладиженко; Павел Иванов',
    sources:
      'Семейные сведения из чата: отец Ивана Павловича Ладыженко. Дополнительная зацепка: список прихожан 1925 года, где возраст уводит к рождению около 1894-1895.',
    researchStatus: 'in_review',
    accent: 'blue',
    x: 360,
    y: 300,
  },
  {
    id: 'anna-kovalenko-ladyzhenko',
    treeId: 'ladyzhenko-family',
    label: 'Анна Коваленко',
    firstName: 'Анна',
    lastName: 'Коваленко',
    years: 'ок. 1899-1900',
    place: 'с. Скородное, Ельский район, Гомельская область',
    branch: 'Линия Коваленко',
    note: 'Мать Ивана Павловича. Девичья фамилия по рабочей версии — Коваленко. В списке 1925 года вероятно записана как «Анна Алексеева», что может быть формой отчества, а не фамилии. Есть конфликтующий вторичный след «1904».',
    aliases: 'Анна Коваленко; Анна Алексеевна; Анна Алексеева; Анна Ладыженко; Лодиженко; Лодыженко; Ладиженко',
    sources:
      'Семейные сведения из чата: мать Ивана Павловича Ладыженко. Исследовательские карточки: рабочая версия девичьей фамилии Коваленко, отчество предположительно Алексеевна, диапазон рождения 1899-1900 с альтернативным следом 1904.',
    researchStatus: 'in_review',
    accent: 'pink',
    x: 620,
    y: 300,
  },
  {
    id: 'ivan-pavlovich-ladyzhenko',
    treeId: 'ladyzhenko-family',
    label: 'Иван Павлович Ладыженко',
    firstName: 'Иван',
    lastName: 'Ладыженко',
    years: '03.09.1924 - ?',
    place: 'с. Скородное, Ельский район, Гомельская область, Беларусь',
    branch: 'Основная подтвержденная линия',
    note: 'Дед пользователя. Это опорная персона ветки, от которой в чате строилась вся дальнейшая реконструкция семьи.',
    aliases: 'Ладыженко; Лодиженко; Лодыженко; Ладиженко',
    sources:
      'Прямые семейные сведения из чата: дата рождения 3 сентября 1924 года, место рождения — с. Скородное, Ельский район, Гомельская область, Беларусь.',
    researchStatus: 'confirmed',
    accent: 'blue',
    x: 490,
    y: 500,
  },
  {
    id: 'aleksey-ilyin-kovalenko',
    treeId: 'ladyzhenko-family',
    label: 'Алексей Ильин Коваленко',
    firstName: 'Алексей',
    lastName: 'Коваленко',
    years: 'не подтверждено',
    place: 'Скородное или ближайший приход',
    branch: 'Гипотеза по линии Коваленко',
    note: 'Возможный отец Анны. Гипотеза основана на сочетании формы «Анна Алексеева» и упоминании Коваленко Алексея Ильина в том же вторичном списке. Прямого документа, подтверждающего родство, пока нет.',
    aliases: 'Коваленко Алексей Ильин; Алексей Ильич Коваленко',
    sources:
      'Только рабочая гипотеза из исследовательских карточек чата. Для подтверждения нужны запись о браке Павла и Анны либо метрическая запись о рождении Анны Коваленко.',
    researchStatus: 'hypothesis',
    accent: 'slate',
    x: 620,
    y: 120,
  },
]

const ladyzhenkoResearchRelationships: Array<typeof treeRelationships.$inferInsert> = [
  {
    id: 'rel-pavel-ivan',
    treeId: 'ladyzhenko-family',
    sourceId: 'pavel-ivanovich-ladyzhenko',
    targetId: 'ivan-pavlovich-ladyzhenko',
    kind: 'parent-child',
  },
  {
    id: 'rel-anna-ivan',
    treeId: 'ladyzhenko-family',
    sourceId: 'anna-kovalenko-ladyzhenko',
    targetId: 'ivan-pavlovich-ladyzhenko',
    kind: 'parent-child',
  },
  {
    id: 'rel-pavel-anna-partner',
    treeId: 'ladyzhenko-family',
    sourceId: 'pavel-ivanovich-ladyzhenko',
    targetId: 'anna-kovalenko-ladyzhenko',
    kind: 'partner',
  },
  {
    id: 'rel-aleksey-anna',
    treeId: 'ladyzhenko-family',
    sourceId: 'aleksey-ilyin-kovalenko',
    targetId: 'anna-kovalenko-ladyzhenko',
    kind: 'parent-child',
  },
]

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

  const ladyzhenkoTreeId = 'ladyzhenko-family'
  const legacyLadyzhenkoIds = new Set(['lady-left', 'lady-top', 'lady-right', 'lady-bottom'])
  const existingLadyzhenkoPersons = await db
    .select({ id: treePersons.id })
    .from(treePersons)
    .where(eq(treePersons.treeId, ladyzhenkoTreeId))

  const shouldReplaceLegacyLadyzhenkoTree =
    existingLadyzhenkoPersons.length === 0 || existingLadyzhenkoPersons.some((person) => legacyLadyzhenkoIds.has(person.id))

  if (shouldReplaceLegacyLadyzhenkoTree) {
    await db
      .update(trees)
      .set({
        title: 'Род Ладыженко',
        surname: 'Ладыженко',
        privacy: 'private',
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, ladyzhenkoTreeId))

    await db.delete(treeRelationships).where(eq(treeRelationships.treeId, ladyzhenkoTreeId))
    await db.delete(treePersons).where(eq(treePersons.treeId, ladyzhenkoTreeId))

    await db.insert(treePersons).values(ladyzhenkoResearchPersons)
    await db.insert(treeRelationships).values(ladyzhenkoResearchRelationships)
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
