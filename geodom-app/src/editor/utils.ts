import { MarkerType, type Edge, type Node } from '@xyflow/react'

import type { CompactPersonNodeData } from '../components/CompactPersonNode'
import type { TreeEditorRelationship, TreePerson, TreeSummary } from '../types'

const COMPACT_NODE_WIDTH = 144
const COMPACT_NODE_HEIGHT = 48

export type PersonFormState = {
  firstName: string
  lastName: string
  years: string
  place: string
  branch: string
  note: string
  accent: TreePerson['accent']
}

export type TreeFormState = {
  title: string
  surname: string
  privacy: TreeSummary['privacy']
}

export function createEditorNodes(persons: TreePerson[], selectedPersonId: string | null): Node<CompactPersonNodeData>[] {
  return persons.map((person) => ({
    id: person.id,
    type: 'compactPerson',
    position: { x: person.x, y: person.y },
    initialWidth: COMPACT_NODE_WIDTH,
    initialHeight: COMPACT_NODE_HEIGHT,
    data: { label: person.label, accent: person.accent, selected: person.id === selectedPersonId },
  }))
}

export function createEditorEdges(relationships: TreeEditorRelationship[]): Edge[] {
  return relationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.source,
    target: relationship.target,
    type: 'smoothstep',
    animated: relationship.kind === 'partner',
    markerEnd: relationship.kind === 'partner' ? undefined : { type: MarkerType.ArrowClosed, color: '#d9d3cd' },
    style:
      relationship.kind === 'partner'
        ? { stroke: '#cbb8a8', strokeWidth: 1.4, strokeDasharray: '5 4' }
        : { stroke: '#d9d3cd', strokeWidth: 1.4 },
  }))
}

export function extractLayout(persons: TreePerson[]) {
  return persons.map((person) => ({ id: person.id, x: Math.round(person.x), y: Math.round(person.y) }))
}

export function getPrivacyLabel(mode: TreeSummary['privacy']) {
  if (mode === 'private') return 'Приватное'
  if (mode === 'shared') return 'Совместное'
  return 'Публичное'
}

export const emptyPersonForm: PersonFormState = {
  firstName: '',
  lastName: '',
  years: '',
  place: '',
  branch: '',
  note: '',
  accent: 'blue',
}

export const emptyTreeForm: TreeFormState = {
  title: '',
  surname: '',
  privacy: 'private',
}
