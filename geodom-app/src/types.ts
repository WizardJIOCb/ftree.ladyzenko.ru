export type PersonId = string

export type Person = {
  id: PersonId
  firstName: string
  lastName: string
  years: string
  place: string
  note: string
  branch: string
  generation: number
  x: number
  y: number
}

export type RelationshipKind = 'parent-child' | 'partner'

export type Relationship = {
  id: string
  source: PersonId
  target: PersonId
  kind: RelationshipKind
}

export type TreeSummary = {
  id: string
  title: string
  surname: string
  members: number
  lastUpdated: string
  privacy: 'private' | 'shared' | 'public'
}
