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

export type RelationshipKind = 'parent-child' | 'partner' | 'related'

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

export type TreePersonAccent = 'blue' | 'pink' | 'slate'
export type TreePersonResearchStatus = 'confirmed' | 'in_review' | 'hypothesis'

export type TreePerson = {
  id: string
  label: string
  firstName: string
  lastName: string
  years: string
  place: string
  branch: string
  note: string
  aliases: string
  sources: string
  researchStatus: TreePersonResearchStatus
  accent: TreePersonAccent
  panelColor: string
  textColor: string
  x: number
  y: number
}

export type TreeEditorRelationship = {
  id: string
  source: string
  target: string
  kind: RelationshipKind
  note: string
  researchStatus: TreePersonResearchStatus
}

export type TreeEditorPayload = {
  tree: TreeSummary
  persons: TreePerson[]
  relationships: TreeEditorRelationship[]
}
