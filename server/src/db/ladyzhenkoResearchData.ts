import { eq } from 'drizzle-orm'

import { db } from './index.js'
import { treePersons, treeRelationships, trees } from './schema.js'

const TREE_ID = 'ladyzhenko-family'
const MENTIONED_BRANCH = 'Подтверждённые упоминания из shared-чата'
const MENTIONED_NOTE =
  'Персона поимённо фигурирует в shared-чате по Ладыженко. Пользователь подтвердил, что это реальная личность из семейного контекста, но точные даты и родственные связи ещё нужно разнести в структуру дерева.'
const MENTIONED_SOURCE =
  'Shared-чат по Ладыженко: подтверждённое поимённое упоминание. На текущем этапе карточка хранит имя и контекст, а связи будут добавляться по мере разборки переписки и документов.'

const corePersons: Array<typeof treePersons.$inferInsert> = [
  {
    id: 'pavel-ivanovich-ladyzhenko',
    treeId: TREE_ID,
    label: 'Павел Иванович Ладыженко',
    firstName: 'Павел Иванович',
    lastName: 'Ладыженко',
    years: 'ок. 1894-1895',
    place: 'с. Скородное, Ельский район, Гомельская область',
    branch: 'Отцовская линия Ладыженко',
    note: 'Отец Ивана Павловича. Подтверждённая персона из shared-чата по ветке Ладыженко.',
    aliases: 'Ладыженко; Лодиженко; Лодыженко; Ладиженко; Павел Иванов',
    sources: 'Shared-чат по Ладыженко: отец Ивана Павловича Ладыженко; упоминание в контексте списка прихожан 1925 года.',
    researchStatus: 'confirmed',
    accent: 'blue',
    x: 360,
    y: 300,
  },
  {
    id: 'anna-kovalenko-ladyzhenko',
    treeId: TREE_ID,
    label: 'Анна Коваленко',
    firstName: 'Анна',
    lastName: 'Коваленко',
    years: 'ок. 1899-1900',
    place: 'с. Скородное, Ельский район, Гомельская область',
    branch: 'Линия Коваленко',
    note: 'Мать Ивана Павловича. В shared-чате фигурирует как Анна Коваленко, а также как Анна Алексеева и Анна Ладыженко.',
    aliases: 'Анна Коваленко; Анна Алексеева; Анна Ладыженко',
    sources: 'Shared-чат по Ладыженко: мать Ивана Павловича Ладыженко.',
    researchStatus: 'confirmed',
    accent: 'pink',
    x: 620,
    y: 300,
  },
  {
    id: 'ivan-pavlovich-ladyzhenko',
    treeId: TREE_ID,
    label: 'Иван Павлович Ладыженко',
    firstName: 'Иван Павлович',
    lastName: 'Ладыженко',
    years: '03.09.1924 - ?',
    place: 'с. Скородное, Ельский район, Гомельская область, Беларусь',
    branch: 'Основная подтверждённая линия',
    note: 'Опорная персона ветки. В shared-чате указаны дата рождения 3 сентября 1924 года и место рождения: село Скородное, Ельский район, Гомельская область, Беларусь.',
    aliases: 'Ладыженко; Лодиженко; Лодыженко; Ладиженко',
    sources: 'Shared-чат по Ладыженко: прямые семейные сведения об Иване Павловиче Ладыженко.',
    researchStatus: 'confirmed',
    accent: 'blue',
    x: 490,
    y: 500,
  },
  {
    id: 'aleksey-ilyin-kovalenko',
    treeId: TREE_ID,
    label: 'Алексей Ильин Коваленко',
    firstName: 'Алексей Ильин',
    lastName: 'Коваленко',
    years: '',
    place: 'Скородное или ближайший приход',
    branch: 'Контекст линии Коваленко',
    note: 'Фигурирует в shared-чате рядом с линией Анны Коваленко и добавляет контекст к семейной реконструкции.',
    aliases: 'Коваленко Алексей Ильин; Алексей Ильич Коваленко',
    sources: 'Shared-чат по Ладыженко: поимённое упоминание рядом с линией Коваленко.',
    researchStatus: 'confirmed',
    accent: 'slate',
    x: 620,
    y: 120,
  },
]

const mentionedLadyzhenkoPeople = [
  { id: 'grigoriy-ivanovich-ladyzhenko', label: 'Григорий Иванович Ладыженко', firstName: 'Григорий Иванович' },
  { id: 'ekaterina-ladyzhenko', label: 'Екатерина Ладыженко', firstName: 'Екатерина' },
  { id: 'aleksandr-ladyzhenko', label: 'Александр Ладыженко', firstName: 'Александр' },
  { id: 'angelina-dmitrievna-ladyzhenko', label: 'Ангелина Дмитриевна Ладыженко', firstName: 'Ангелина Дмитриевна' },
  { id: 'valentina-vasilevna-ladyzhenko', label: 'Валентина Васильевна Ладыженко', firstName: 'Валентина Васильевна' },
  { id: 'valeriy-ivanovich-ladyzhenko', label: 'Валерий Иванович Ладыженко', firstName: 'Валерий Иванович' },
  { id: 'vasiliy-antonovich-ladyzhenko', label: 'Василий Антонович Ладыженко', firstName: 'Василий Антонович' },
  { id: 'galina-ivanovna-ladyzhenko', label: 'Галина Ивановна Ладыженко', firstName: 'Галина Ивановна' },
  { id: 'evgeniy-ladyzhenko', label: 'Евгений Ладыженко', firstName: 'Евгений' },
  { id: 'elena-ladyzhenko', label: 'Елена Ладыженко', firstName: 'Елена' },
  { id: 'zinaida-aleksandrovna-ladyzhenko', label: 'Зинаида Александровна Ладыженко', firstName: 'Зинаида Александровна' },
  { id: 'zinaida-vladimirovna-ladyzhenko', label: 'Зинаида Владимировна Ладыженко', firstName: 'Зинаида Владимировна' },
  { id: 'zoya-nikolaevna-ladyzhenko', label: 'Зоя Николаевна Ладыженко', firstName: 'Зоя Николаевна' },
  { id: 'ivan-yakovlevich-ladyzhenko', label: 'Иван Яковлевич Ладыженко', firstName: 'Иван Яковлевич' },
  { id: 'mariya-ladyzhenko', label: 'Мария Ладыженко', firstName: 'Мария' },
  { id: 'marina-ladyzhenko', label: 'Марина Ладыженко', firstName: 'Марина' },
  { id: 'mikhail-antonovich-ladyzhenko', label: 'Михаил Антонович Ладыженко', firstName: 'Михаил Антонович' },
  { id: 'nikita-dmitrievich-ladyzhenko', label: 'Никита Дмитриевич Ладыженко', firstName: 'Никита Дмитриевич' },
  { id: 'nikifor-ivanov-ladyzhenko', label: 'Никифор Иванов Ладыженко', firstName: 'Никифор Иванов' },
  { id: 'nikolay-anatolievich-ladyzhenko', label: 'Николай Анатольевич Ладыженко', firstName: 'Николай Анатольевич' },
  { id: 'nikolay-pavlovich-ladyzhenko', label: 'Николай Павлович Ладыженко', firstName: 'Николай Павлович' },
  { id: 'sergey-nikolaevich-ladyzhenko', label: 'Сергей Николаевич Ладыженко', firstName: 'Сергей Николаевич' },
] as const

const mentionedPersons: Array<typeof treePersons.$inferInsert> = mentionedLadyzhenkoPeople.map((person, index) => ({
  id: person.id,
  treeId: TREE_ID,
  label: person.label,
  firstName: person.firstName,
  lastName: 'Ладыженко',
  years: '',
  place: '',
  branch: MENTIONED_BRANCH,
  note: MENTIONED_NOTE,
  aliases: '',
  sources: MENTIONED_SOURCE,
  researchStatus: 'confirmed',
  accent: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'pink' : 'slate',
  x: 900 + (index % 4) * 210,
  y: 90 + Math.floor(index / 4) * 96,
}))

export const ladyzhenkoResearchPersons = [...corePersons, ...mentionedPersons]

export const ladyzhenkoResearchRelationships: Array<typeof treeRelationships.$inferInsert> = [
  {
    id: 'rel-pavel-ivan',
    treeId: TREE_ID,
    sourceId: 'pavel-ivanovich-ladyzhenko',
    targetId: 'ivan-pavlovich-ladyzhenko',
    kind: 'parent-child',
  },
  {
    id: 'rel-anna-ivan',
    treeId: TREE_ID,
    sourceId: 'anna-kovalenko-ladyzhenko',
    targetId: 'ivan-pavlovich-ladyzhenko',
    kind: 'parent-child',
  },
  {
    id: 'rel-pavel-anna-partner',
    treeId: TREE_ID,
    sourceId: 'pavel-ivanovich-ladyzhenko',
    targetId: 'anna-kovalenko-ladyzhenko',
    kind: 'partner',
  },
  {
    id: 'rel-aleksey-anna',
    treeId: TREE_ID,
    sourceId: 'aleksey-ilyin-kovalenko',
    targetId: 'anna-kovalenko-ladyzhenko',
    kind: 'parent-child',
  },
]

export const ladyzhenkoLegacyPersonIds = new Set(['lady-left', 'lady-top', 'lady-right', 'lady-bottom'])

export async function syncLadyzhenkoResearchTree() {
  const [existingTree] = await db.select().from(trees).where(eq(trees.id, TREE_ID)).limit(1)

  if (existingTree) {
    await db
      .update(trees)
      .set({
        title: 'Род Ладыженко',
        surname: 'Ладыженко',
        members: ladyzhenkoResearchPersons.length,
        privacy: 'private',
        lastUpdated: new Date(),
      })
      .where(eq(trees.id, TREE_ID))
  } else {
    await db.insert(trees).values({
      id: TREE_ID,
      title: 'Род Ладыженко',
      surname: 'Ладыженко',
      members: ladyzhenkoResearchPersons.length,
      privacy: 'private',
    })
  }

  await db.delete(treeRelationships).where(eq(treeRelationships.treeId, TREE_ID))
  await db.delete(treePersons).where(eq(treePersons.treeId, TREE_ID))
  await db.insert(treePersons).values(ladyzhenkoResearchPersons)
  await db.insert(treeRelationships).values(ladyzhenkoResearchRelationships)
}
