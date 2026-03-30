import { MarkerType, Position, type Edge, type Node } from '@xyflow/react'
import type { TouchEvent } from 'react'

import type { CompactPersonNodeData } from '../components/CompactPersonNode'
import type { TreeEditorRelationship, TreePerson, TreeSummary } from '../types'

export const EDITOR_NODE_WIDTH = 144
export const EDITOR_NODE_HEIGHT = 48
const HANDLE_SIZE = 8
const AUTO_TOP = 220
const AUTO_LEFT = 280
const AUTO_ROW_GAP = 180
const AUTO_CLUSTER_GAP = 80
const AUTO_COMPONENT_GAP = 280
const AUTO_MEMBER_GAP_COMPACT = 164
const AUTO_PASS_COUNT = 4
const AUTO2_SIDE_GAP = 248
const AUTO2_SIDE_STEP = 124
const AUTO_COLLISION_PASSES = 7
const AUTO_ROW_TOLERANCE = 64
const AUTO1_ROW_GAP = 142
const AUTO1_CLUSTER_GAP = 56
const AUTO1_COMPONENT_GAP = 188
const AUTO1_MEMBER_GAP = 154
const AUTO1_LEVEL_STAGGER_X = 26
const AUTO1_CLUSTER_STAGGER_Y = 14
const AUTO1_MEMBER_STAGGER_Y = 10
const AUTO1_ROW_BUCKET = 98
const AUTO1_PACK_GAP = 26
const AUTO2_ROW_BUCKET = 132
const AUTO2_PACK_GAP = 52
const AUTO2_VERTICAL_CLEARANCE = 44

export type AutoLayoutMode = 'auto1' | 'auto2'
export type EditorVisualMode = 'accent' | 'era'

export type PersonFormState = {
  firstName: string
  lastName: string
  years: string
  place: string
  branch: string
  note: string
  aliases: string
  sources: string
  researchStatus: TreePerson['researchStatus']
  accent: TreePerson['accent']
  panelColor: string
  textColor: string
}

export type TreeFormState = {
  title: string
  surname: string
  privacy: TreeSummary['privacy']
}

export type EditorViewSettings = {
  lineThickness: number
  showRelationshipLabels: boolean
  autoColorNodes: boolean
}

export const defaultEditorViewSettings: EditorViewSettings = {
  lineThickness: 1.8,
  showRelationshipLabels: true,
  autoColorNodes: true,
}

type AutoCluster = {
  id: string
  memberIds: string[]
  parentIds: Set<string>
  childIds: Set<string>
  relatedIds: Set<string>
  level: number
  center: number
  width: number
}

type AutoGraph = {
  personMap: Map<string, TreePerson>
  clusters: Map<string, AutoCluster>
  components: AutoCluster[][]
  clusterByPersonId: Map<string, string>
}

class DisjointSet {
  private parent = new Map<string, string>()

  constructor(ids: string[]) {
    ids.forEach((id) => this.parent.set(id, id))
  }

  find(id: string): string {
    const current = this.parent.get(id) ?? id
    if (current === id) return current

    const root = this.find(current)
    this.parent.set(id, root)
    return root
  }

  union(left: string, right: string) {
    const leftRoot = this.find(left)
    const rightRoot = this.find(right)
    if (leftRoot !== rightRoot) {
      this.parent.set(rightRoot, leftRoot)
    }
  }
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function weightedCenter(values: Array<{ value: number; weight: number }>, fallback: number) {
  if (values.length === 0) return fallback

  const totalWeight = values.reduce((sum, entry) => sum + entry.weight, 0)
  if (totalWeight === 0) return fallback

  return values.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / totalWeight
}

function packCenters(clusters: AutoCluster[], targetCenters: Map<string, number>, gap = AUTO_CLUSTER_GAP) {
  const ordered = [...clusters].sort((left, right) => {
    const delta = (targetCenters.get(left.id) ?? left.center) - (targetCenters.get(right.id) ?? right.center)
    if (delta !== 0) return delta
    return left.memberIds[0]?.localeCompare(right.memberIds[0] ?? '', 'ru') ?? 0
  })

  let cursor = 0
  const packedCenters = new Map<string, number>()

  ordered.forEach((cluster, index) => {
    const center = cursor + cluster.width / 2
    packedCenters.set(cluster.id, center)
    cursor = center + cluster.width / 2 + (index < ordered.length - 1 ? gap : 0)
  })

  const packedAverage = average(ordered.map((cluster) => packedCenters.get(cluster.id) ?? cluster.center))
  const targetAverage = average(ordered.map((cluster) => targetCenters.get(cluster.id) ?? cluster.center))
  const shift = targetAverage - packedAverage

  ordered.forEach((cluster) => {
    cluster.center = (packedCenters.get(cluster.id) ?? cluster.center) + shift
  })
}

function buildAutoGraph(persons: TreePerson[], relationships: TreeEditorRelationship[]): AutoGraph {
  const personMap = new Map(persons.map((person) => [person.id, person]))
  const disjointSet = new DisjointSet(persons.map((person) => person.id))

  relationships.forEach((relationship) => {
    if (relationship.kind === 'partner') {
      disjointSet.union(relationship.source, relationship.target)
    }
  })

  const memberIdsByCluster = new Map<string, string[]>()
  const clusterByPersonId = new Map<string, string>()

  persons.forEach((person) => {
    const clusterId = disjointSet.find(person.id)
    clusterByPersonId.set(person.id, clusterId)
    const members = memberIdsByCluster.get(clusterId) ?? []
    members.push(person.id)
    memberIdsByCluster.set(clusterId, members)
  })

  const clusters = new Map<string, AutoCluster>()
  memberIdsByCluster.forEach((memberIds, clusterId) => {
    const orderedMembers = [...memberIds].sort((leftId, rightId) => {
      const left = personMap.get(leftId)
      const right = personMap.get(rightId)
      if (!left || !right) return 0
      if (left.x !== right.x) return left.x - right.x
      return left.label.localeCompare(right.label, 'ru')
    })

    const width = Math.max(EDITOR_NODE_WIDTH, EDITOR_NODE_WIDTH + (orderedMembers.length - 1) * AUTO_MEMBER_GAP_COMPACT)

    clusters.set(clusterId, {
      id: clusterId,
      memberIds: orderedMembers,
      parentIds: new Set<string>(),
      childIds: new Set<string>(),
      relatedIds: new Set<string>(),
      level: 0,
      center: average(orderedMembers.map((memberId) => personMap.get(memberId)?.x ?? 0)),
      width,
    })
  })

  relationships.forEach((relationship) => {
    const sourceClusterId = clusterByPersonId.get(relationship.source)
    const targetClusterId = clusterByPersonId.get(relationship.target)
    const sourceCluster = sourceClusterId ? clusters.get(sourceClusterId) : undefined
    const targetCluster = targetClusterId ? clusters.get(targetClusterId) : undefined

    if (!sourceCluster || !targetCluster || sourceCluster.id === targetCluster.id) return

    if (relationship.kind === 'parent-child') {
      sourceCluster.childIds.add(targetCluster.id)
      targetCluster.parentIds.add(sourceCluster.id)
    } else {
      sourceCluster.relatedIds.add(targetCluster.id)
      targetCluster.relatedIds.add(sourceCluster.id)
    }
  })

  const indegree = new Map<string, number>()
  clusters.forEach((cluster) => {
    indegree.set(cluster.id, cluster.parentIds.size)
    cluster.level = 0
  })

  const queue = [...clusters.values()].filter((cluster) => (indegree.get(cluster.id) ?? 0) === 0).map((cluster) => cluster.id)
  while (queue.length > 0) {
    const clusterId = queue.shift()
    if (!clusterId) continue

    const cluster = clusters.get(clusterId)
    if (!cluster) continue

    cluster.childIds.forEach((childId) => {
      const child = clusters.get(childId)
      if (!child) return

      child.level = Math.max(child.level, cluster.level + 1)
      const nextInDegree = (indegree.get(childId) ?? 0) - 1
      indegree.set(childId, nextInDegree)
      if (nextInDegree === 0) {
        queue.push(childId)
      }
    })
  }

  clusters.forEach((cluster) => {
    if (cluster.parentIds.size === 0 && cluster.childIds.size === 0 && cluster.relatedIds.size > 0) {
      const neighborLevels = [...cluster.relatedIds]
        .map((neighborId) => clusters.get(neighborId)?.level)
        .filter((level): level is number => level !== undefined)

      if (neighborLevels.length > 0) {
        cluster.level = Math.max(0, Math.round(average(neighborLevels)))
      }
    }
  })

  const visited = new Set<string>()
  const components: AutoCluster[][] = []

  clusters.forEach((cluster) => {
    if (visited.has(cluster.id)) return

    const component: AutoCluster[] = []
    const stack = [cluster.id]
    visited.add(cluster.id)

    while (stack.length > 0) {
      const currentId = stack.pop()
      if (!currentId) continue

      const current = clusters.get(currentId)
      if (!current) continue

      component.push(current)
      const neighbors = [...current.parentIds, ...current.childIds, ...current.relatedIds]
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          stack.push(neighborId)
        }
      })
    }

    components.push(component)
  })

  return { personMap, clusters, components, clusterByPersonId }
}

function applyAutoLayoutMode1(graph: AutoGraph) {
  const positioned = new Map<string, { x: number; y: number }>()
  let componentStartX = AUTO_LEFT
  const rowGap = AUTO1_ROW_GAP
  const clusterGap = AUTO1_CLUSTER_GAP
  const componentGap = AUTO1_COMPONENT_GAP
  const memberGap = AUTO1_MEMBER_GAP
  const levelStaggerX = AUTO1_LEVEL_STAGGER_X
  const clusterStaggerY = AUTO1_CLUSTER_STAGGER_Y
  const memberStaggerY = AUTO1_MEMBER_STAGGER_Y

  const sortedComponents = [...graph.components].sort((left, right) => {
    const leftScore = Math.min(...left.map((cluster) => cluster.level))
    const rightScore = Math.min(...right.map((cluster) => cluster.level))
    if (leftScore !== rightScore) return leftScore - rightScore
    return left.length - right.length
  })

  sortedComponents.forEach((component) => {
    const minLevel = Math.min(...component.map((cluster) => cluster.level))
    component.forEach((cluster) => {
      cluster.level -= minLevel
    })

    const maxLevel = Math.max(...component.map((cluster) => cluster.level))

    for (let passIndex = 0; passIndex < AUTO_PASS_COUNT; passIndex += 1) {
      for (let level = 0; level <= maxLevel; level += 1) {
        const clustersOnLevel = component.filter((cluster) => cluster.level === level)
        const targets = new Map<string, number>()

        clustersOnLevel.forEach((cluster) => {
          const weightedTargets: Array<{ value: number; weight: number }> = []

          cluster.parentIds.forEach((parentId) => {
            const parent = graph.clusters.get(parentId)
            if (parent) weightedTargets.push({ value: parent.center, weight: 3 })
          })
          cluster.childIds.forEach((childId) => {
            const child = graph.clusters.get(childId)
            if (child) weightedTargets.push({ value: child.center, weight: 2 })
          })
          cluster.relatedIds.forEach((relatedId) => {
            const related = graph.clusters.get(relatedId)
            if (related) weightedTargets.push({ value: related.center, weight: 1 })
          })

          targets.set(cluster.id, weightedCenter(weightedTargets, cluster.center))
        })

        packCenters(clustersOnLevel, targets, clusterGap)
      }

      for (let level = maxLevel; level >= 0; level -= 1) {
        const clustersOnLevel = component.filter((cluster) => cluster.level === level)
        const targets = new Map<string, number>()

        clustersOnLevel.forEach((cluster) => {
          const weightedTargets: Array<{ value: number; weight: number }> = []

          cluster.parentIds.forEach((parentId) => {
            const parent = graph.clusters.get(parentId)
            if (parent) weightedTargets.push({ value: parent.center, weight: 2 })
          })
          cluster.childIds.forEach((childId) => {
            const child = graph.clusters.get(childId)
            if (child) weightedTargets.push({ value: child.center, weight: 3 })
          })
          cluster.relatedIds.forEach((relatedId) => {
            const related = graph.clusters.get(relatedId)
            if (related) weightedTargets.push({ value: related.center, weight: 1 })
          })

          targets.set(cluster.id, weightedCenter(weightedTargets, cluster.center))
        })

        packCenters(clustersOnLevel, targets, clusterGap)
      }
    }

    const componentMinX = Math.min(...component.map((cluster) => cluster.center - cluster.width / 2))
    const componentMaxX = Math.max(...component.map((cluster) => cluster.center + cluster.width / 2))
    const componentShift = componentStartX - componentMinX
    const clustersByLevel = new Map<number, AutoCluster[]>()

    component.forEach((cluster) => {
      const levelClusters = clustersByLevel.get(cluster.level) ?? []
      levelClusters.push(cluster)
      clustersByLevel.set(cluster.level, levelClusters)
    })

    clustersByLevel.forEach((levelClusters, level) => {
      const orderedLevelClusters = [...levelClusters].sort((left, right) => left.center - right.center)
      const rowShiftX = level % 2 === 0 ? 0 : levelStaggerX

      orderedLevelClusters.forEach((cluster, clusterIndex) => {
        const membersWidth = EDITOR_NODE_WIDTH + (cluster.memberIds.length - 1) * memberGap
        const membersStartX = cluster.center + componentShift + rowShiftX - membersWidth / 2
        const clusterYOffset = clusterIndex % 2 === 0 ? 0 : clusterStaggerY
        const baseY = AUTO_TOP + cluster.level * rowGap + clusterYOffset

        cluster.memberIds.forEach((memberId, index) => {
          const memberYOffset = index % 2 === 0 ? 0 : memberStaggerY
          positioned.set(memberId, {
            x: Math.round(membersStartX + index * memberGap),
            y: Math.round(baseY + memberYOffset),
          })
        })
      })
    })

    componentStartX += componentMaxX - componentMinX + componentGap
  })

  return positioned
}

function createPrimaryTree(component: AutoCluster[]) {
  const clusterMap = new Map(component.map((cluster) => [cluster.id, cluster]))
  const primaryParentById = new Map<string, string>()
  const primaryChildrenById = new Map<string, string[]>()

  component.forEach((cluster) => {
    const sortedParents = [...cluster.parentIds]
      .map((parentId) => clusterMap.get(parentId))
      .filter((parent): parent is AutoCluster => Boolean(parent))
      .sort((left, right) => {
        if (left.level !== right.level) return left.level - right.level
        if (left.center !== right.center) return left.center - right.center
        return left.id.localeCompare(right.id, 'ru')
      })

    const primaryParent = sortedParents[0]
    if (!primaryParent) return

    primaryParentById.set(cluster.id, primaryParent.id)
    const children = primaryChildrenById.get(primaryParent.id) ?? []
    children.push(cluster.id)
    primaryChildrenById.set(primaryParent.id, children)
  })

  primaryChildrenById.forEach((children) => {
    children.sort((leftId, rightId) => {
      const left = clusterMap.get(leftId)
      const right = clusterMap.get(rightId)
      if (!left || !right) return 0
      if (left.center !== right.center) return left.center - right.center
      return left.id.localeCompare(right.id, 'ru')
    })
  })

  return { clusterMap, primaryParentById, primaryChildrenById }
}

function applyAutoLayoutMode2(graph: AutoGraph) {
  const positioned = new Map<string, { x: number; y: number }>()
  let componentStartX = AUTO_LEFT

  const sortedComponents = [...graph.components].sort((left, right) => {
    const leftLevel = Math.min(...left.map((cluster) => cluster.level))
    const rightLevel = Math.min(...right.map((cluster) => cluster.level))
    if (leftLevel !== rightLevel) return leftLevel - rightLevel
    return right.length - left.length
  })

  sortedComponents.forEach((component) => {
    const minLevel = Math.min(...component.map((cluster) => cluster.level))
    component.forEach((cluster) => {
      cluster.level -= minLevel
    })

    const { clusterMap, primaryParentById, primaryChildrenById } = createPrimaryTree(component)
    const backboneIds = new Set<string>()
    component.forEach((cluster) => {
      if (cluster.parentIds.size > 0 || cluster.childIds.size > 0) {
        backboneIds.add(cluster.id)
      }
    })

    const subtreeWidthById = new Map<string, number>()
    function measure(clusterId: string): number {
      const cached = subtreeWidthById.get(clusterId)
      if (cached !== undefined) return cached

      const cluster = clusterMap.get(clusterId)
      if (!cluster) return EDITOR_NODE_WIDTH

      const children = primaryChildrenById.get(clusterId) ?? []
      const childrenWidth = children.reduce((sum, childId, index) => sum + measure(childId) + (index > 0 ? AUTO_CLUSTER_GAP : 0), 0)
      const width = Math.max(cluster.width + 28, childrenWidth || cluster.width + 28)
      subtreeWidthById.set(clusterId, width)
      return width
    }

    const rootIds = component
      .filter((cluster) => backboneIds.has(cluster.id) && !primaryParentById.has(cluster.id))
      .sort((left, right) => {
        const rightWeight = right.childIds.size + right.relatedIds.size
        const leftWeight = left.childIds.size + left.relatedIds.size
        if (rightWeight !== leftWeight) return rightWeight - leftWeight
        return left.center - right.center
      })
      .map((cluster) => cluster.id)

    const anchorIds = rootIds.length > 0 ? rootIds : component.sort((left, right) => left.center - right.center).map((cluster) => cluster.id)
    const clusterCenterById = new Map<string, number>()
    let cursor = componentStartX

    function assign(clusterId: string, left: number) {
      const cluster = clusterMap.get(clusterId)
      if (!cluster) return

      const subtreeWidth = measure(clusterId)
      clusterCenterById.set(clusterId, left + subtreeWidth / 2)

      const children = primaryChildrenById.get(clusterId) ?? []
      let childLeft = left
      children.forEach((childId) => {
        assign(childId, childLeft)
        childLeft += measure(childId) + AUTO_CLUSTER_GAP
      })
    }

    anchorIds.forEach((rootId, rootIndex) => {
      assign(rootId, cursor)
      cursor += measure(rootId) + (rootIndex < anchorIds.length - 1 ? AUTO_COMPONENT_GAP : 0)
    })

    const rightLaneUsage = new Map<number, number>()
    const leftLaneUsage = new Map<number, number>()

    component.forEach((cluster) => {
      if (clusterCenterById.has(cluster.id)) return

      const placedNeighbors = [...cluster.relatedIds]
        .map((neighborId) => clusterMap.get(neighborId))
        .filter((neighbor): neighbor is AutoCluster => neighbor !== undefined)
        .filter((neighbor) => clusterCenterById.has(neighbor.id))
        .sort((left, right) => left.level - right.level || left.center - right.center)

      const anchor = placedNeighbors[0] ?? component[0]
      const laneMap = (anchor.level + cluster.level) % 2 === 0 ? rightLaneUsage : leftLaneUsage
      const laneDirection = laneMap === rightLaneUsage ? 1 : -1
      const laneIndex = laneMap.get(cluster.level) ?? 0
      laneMap.set(cluster.level, laneIndex + 1)

      const anchorCenter = clusterCenterById.get(anchor.id) ?? anchor.center
      clusterCenterById.set(
        cluster.id,
        anchorCenter + laneDirection * (AUTO2_SIDE_GAP + laneIndex * AUTO2_SIDE_STEP + cluster.width / 2),
      )
    })

    const componentCenters = component.map((cluster) => clusterCenterById.get(cluster.id) ?? cluster.center)
    const componentMinCenter = Math.min(...componentCenters)
    const componentMaxCenter = Math.max(...componentCenters)

    component.forEach((cluster) => {
      const center = clusterCenterById.get(cluster.id) ?? cluster.center
      const membersWidth = EDITOR_NODE_WIDTH + (cluster.memberIds.length - 1) * AUTO_MEMBER_GAP_COMPACT
      const levelShiftX = cluster.level % 2 === 0 ? 0 : 34
      const membersStartX = center + levelShiftX - membersWidth / 2
      const baseY = AUTO_TOP + cluster.level * AUTO_ROW_GAP + (cluster.relatedIds.size > cluster.childIds.size ? 10 : 0)

      cluster.memberIds.forEach((memberId, index) => {
        const memberYOffset = index % 2 === 0 ? 0 : 14
        positioned.set(memberId, {
          x: Math.round(membersStartX + index * AUTO_MEMBER_GAP_COMPACT),
          y: Math.round(baseY + memberYOffset),
        })
      })
    })

    componentStartX += componentMaxCenter - componentMinCenter + AUTO_COMPONENT_GAP + 120
  })

  return positioned
}

function applyRowStagger(positioned: Map<string, { x: number; y: number }>, mode: AutoLayoutMode) {
  const buckets = new Map<number, Array<{ id: string; x: number; y: number }>>()
  const bucketSize = mode === 'auto2' ? Math.max(AUTO_ROW_GAP - 36, 120) : Math.max(AUTO_ROW_GAP - 44, 112)

  positioned.forEach((position, id) => {
    const bucketKey = Math.round((position.y - AUTO_TOP) / bucketSize)
    const items = buckets.get(bucketKey) ?? []
    items.push({ id, x: position.x, y: position.y })
    buckets.set(bucketKey, items)
  })

  buckets.forEach((items, bucketKey) => {
    items
      .sort((left, right) => left.x - right.x)
      .forEach((item, index) => {
        const baseOffset = mode === 'auto2' ? 18 : 12
        const diagonalOffset = bucketKey % 2 === 0 ? 0 : baseOffset / 2
        const next = positioned.get(item.id)
        if (!next) return

        next.y = Math.round(next.y + (index % 2 === 0 ? 0 : baseOffset) + diagonalOffset)
        positioned.set(item.id, next)
      })
  })
}

function compactAuto1Rows(positioned: Map<string, { x: number; y: number }>) {
  const rows = new Map<number, Array<{ id: string; x: number; y: number }>>()

  positioned.forEach((position, id) => {
    const rowKey = Math.round((position.y - AUTO_TOP) / AUTO1_ROW_BUCKET)
    const items = rows.get(rowKey) ?? []
    items.push({ id, x: position.x, y: position.y })
    rows.set(rowKey, items)
  })

  rows.forEach((items) => {
    if (items.length < 2) return

    const ordered = [...items].sort((left, right) => left.x - right.x)
    const currentMinX = ordered[0]?.x ?? 0
    const currentMaxX = (ordered[ordered.length - 1]?.x ?? 0) + EDITOR_NODE_WIDTH
    const currentSpan = currentMaxX - currentMinX
    const packedSpan = ordered.length * EDITOR_NODE_WIDTH + (ordered.length - 1) * AUTO1_PACK_GAP

    if (currentSpan <= packedSpan + 80) return

    const averageCenter = average(ordered.map((item) => item.x + EDITOR_NODE_WIDTH / 2))
    let cursor = averageCenter - packedSpan / 2

    ordered.forEach((item) => {
      const next = positioned.get(item.id)
      if (!next) return

      next.x = Math.round(cursor)
      positioned.set(item.id, next)
      cursor += EDITOR_NODE_WIDTH + AUTO1_PACK_GAP
    })
  })
}

function compactAuto2Rows(positioned: Map<string, { x: number; y: number }>) {
  const rows = new Map<number, Array<{ id: string; x: number; y: number }>>()

  positioned.forEach((position, id) => {
    const rowKey = Math.round((position.y - AUTO_TOP) / AUTO2_ROW_BUCKET)
    const items = rows.get(rowKey) ?? []
    items.push({ id, x: position.x, y: position.y })
    rows.set(rowKey, items)
  })

  rows.forEach((items) => {
    if (items.length < 2) return

    const ordered = [...items].sort((left, right) => left.x - right.x)
    const originalCenter = average(ordered.map((item) => item.x + EDITOR_NODE_WIDTH / 2))
    let cursor = ordered[0]?.x ?? 0

    ordered.forEach((item, index) => {
      const next = positioned.get(item.id)
      if (!next) return

      if (index === 0) {
        next.x = Math.round(cursor)
      } else {
        cursor = Math.max(cursor + EDITOR_NODE_WIDTH + AUTO2_PACK_GAP, item.x)
        next.x = Math.round(cursor)
      }

      positioned.set(item.id, next)
    })

    const adjusted = ordered
      .map((item) => positioned.get(item.id))
      .filter((item): item is { x: number; y: number } => Boolean(item))
    const adjustedCenter = average(adjusted.map((item) => item.x + EDITOR_NODE_WIDTH / 2))
    const shift = originalCenter - adjustedCenter

    ordered.forEach((item) => {
      const next = positioned.get(item.id)
      if (!next) return
      next.x = Math.round(next.x + shift)
      positioned.set(item.id, next)
    })
  })
}

function resolveAuto2Intersections(positioned: Map<string, { x: number; y: number }>) {
  for (let passIndex = 0; passIndex < AUTO_COLLISION_PASSES + 3; passIndex += 1) {
    const items = [...positioned.entries()]
      .map(([id, position]) => ({ id, ...position }))
      .sort((left, right) => (left.y !== right.y ? left.y - right.y : left.x - right.x))

    for (let index = 0; index < items.length; index += 1) {
      const current = items[index]
      const currentPosition = positioned.get(current.id)
      if (!currentPosition) continue

      for (let nextIndex = index + 1; nextIndex < items.length; nextIndex += 1) {
        const candidate = items[nextIndex]
        const candidatePosition = positioned.get(candidate.id)
        if (!candidatePosition) continue

        if (candidatePosition.y - currentPosition.y > EDITOR_NODE_HEIGHT + AUTO2_VERTICAL_CLEARANCE + AUTO_ROW_TOLERANCE) {
          break
        }

        const overlapX = currentPosition.x + EDITOR_NODE_WIDTH + AUTO2_PACK_GAP - candidatePosition.x
        const overlapY = currentPosition.y + EDITOR_NODE_HEIGHT + AUTO2_VERTICAL_CLEARANCE - candidatePosition.y
        if (overlapX <= 0 || overlapY <= 0) continue

        const nearSameRow = Math.abs(candidatePosition.y - currentPosition.y) <= AUTO_ROW_TOLERANCE + 18
        if (nearSameRow) {
          candidatePosition.x = Math.round(candidatePosition.x + overlapX + 12)
          if ((nextIndex + passIndex) % 2 === 1) {
            candidatePosition.y = Math.round(candidatePosition.y + Math.min(14 + passIndex * 2, 26))
          }
        } else {
          candidatePosition.y = Math.round(candidatePosition.y + overlapY + 12)
          if (overlapX > EDITOR_NODE_WIDTH * 0.25) {
            candidatePosition.x = Math.round(candidatePosition.x + 20)
          }
        }

        positioned.set(candidate.id, candidatePosition)
        items[nextIndex] = { ...candidate, ...candidatePosition }
      }
    }
  }
}

function resolveNodeCollisions(positioned: Map<string, { x: number; y: number }>, mode: AutoLayoutMode) {
  const horizontalGap = mode === 'auto2' ? 42 : 30
  const verticalGap = mode === 'auto2' ? 34 : 24
  const sameRowThreshold = mode === 'auto2' ? AUTO_ROW_TOLERANCE : AUTO_ROW_TOLERANCE - 10

  for (let passIndex = 0; passIndex < AUTO_COLLISION_PASSES; passIndex += 1) {
    const items = [...positioned.entries()]
      .map(([id, position]) => ({ id, ...position }))
      .sort((left, right) => {
        if (left.y !== right.y) return left.y - right.y
        return left.x - right.x
      })

    for (let index = 0; index < items.length; index += 1) {
      const current = items[index]
      const currentPosition = positioned.get(current.id)
      if (!currentPosition) continue

      for (let nextIndex = index + 1; nextIndex < items.length; nextIndex += 1) {
        const candidate = items[nextIndex]
        const candidatePosition = positioned.get(candidate.id)
        if (!candidatePosition) continue

        if (candidatePosition.y - currentPosition.y > EDITOR_NODE_HEIGHT + verticalGap + sameRowThreshold) {
          break
        }

        const overlapX = currentPosition.x + EDITOR_NODE_WIDTH + horizontalGap - candidatePosition.x
        const overlapY = currentPosition.y + EDITOR_NODE_HEIGHT + verticalGap - candidatePosition.y
        if (overlapX <= 0 || overlapY <= 0) continue

        const sameRow = Math.abs(candidatePosition.y - currentPosition.y) <= sameRowThreshold
        if (sameRow) {
          if (mode === 'auto1' && overlapX > EDITOR_NODE_WIDTH * 0.28) {
            candidatePosition.x = Math.round(candidatePosition.x + 8 + ((nextIndex + passIndex) % 2 === 0 ? 0 : 10))
            candidatePosition.y = Math.round(candidatePosition.y + Math.min(32 + passIndex * 4, 54))
          } else {
            candidatePosition.x = Math.round(candidatePosition.x + overlapX + 8)
            candidatePosition.y = Math.round(candidatePosition.y + ((nextIndex + passIndex) % 2 === 0 ? 0 : Math.min(16 + passIndex * 2, 26)))
          }
        } else {
          candidatePosition.y = Math.round(candidatePosition.y + overlapY + 8)
          if (overlapX > EDITOR_NODE_WIDTH * 0.45) {
            candidatePosition.x = Math.round(candidatePosition.x + (mode === 'auto2' ? 18 : 12))
          }
        }

        positioned.set(candidate.id, candidatePosition)
        items[nextIndex] = { ...candidate, ...candidatePosition }
      }
    }
  }
}

export function buildGenerationByPerson(persons: TreePerson[], relationships: TreeEditorRelationship[]) {
  const graph = buildAutoGraph(persons, relationships)
  const generationByPerson = new Map<string, number>()

  persons.forEach((person) => {
    const clusterId = graph.clusterByPersonId.get(person.id)
    const level = clusterId ? graph.clusters.get(clusterId)?.level ?? 0 : 0
    generationByPerson.set(person.id, level)
  })

  return generationByPerson
}

function parseDisplayYear(person: TreePerson) {
  const match = person.years.match(/(18|19|20)\d{2}/)
  return match ? Number(match[0]) : null
}

function resolveToneIndex(person: TreePerson, generation: number) {
  const year = parseDisplayYear(person)
  if (year !== null) {
    if (year < 1880) return 0
    if (year < 1910) return 1
    if (year < 1940) return 2
    if (year < 1970) return 3
    if (year < 2000) return 4
    return 5
  }

  return ((generation % 6) + 6) % 6
}

function clampLineThickness(value: number) {
  return Math.min(Math.max(Number.isFinite(value) ? value : defaultEditorViewSettings.lineThickness, 1), 4.5)
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

const accentColorMap: Record<TreePerson['accent'], string> = {
  blue: '#7ea5d8',
  pink: '#e58aa9',
  slate: '#7e8aa8',
}

const autoNodePalette = [
  { panel: '#fff6ec', text: '#5c4330', accent: '#d59a68' },
  { panel: '#f6f4ea', text: '#4c4a37', accent: '#9aa06a' },
  { panel: '#eef6f2', text: '#355548', accent: '#6da38c' },
  { panel: '#edf3fb', text: '#31486a', accent: '#7899c8' },
  { panel: '#f6eef7', text: '#5b4261', accent: '#b38ab8' },
  { panel: '#fff0ef', text: '#6a3f3d', accent: '#d58c86' },
]

function resolveNodeAppearance(
  person: TreePerson,
  generation: number,
  visualMode: EditorVisualMode,
  autoColorNodes: boolean,
) {
  const customPanelColor = (person.panelColor ?? '').trim()
  const customTextColor = (person.textColor ?? '').trim()

  if (customPanelColor || customTextColor) {
    return {
      panelColor: customPanelColor || undefined,
      textColor: customTextColor || undefined,
      accentColor: accentColorMap[person.accent],
      toneIndex: resolveToneIndex(person, generation),
    }
  }

  if (autoColorNodes) {
    const palette = autoNodePalette[hashString(`${person.id}:${person.label}:${generation}`) % autoNodePalette.length]
    return {
      panelColor: palette.panel,
      textColor: palette.text,
      accentColor: palette.accent,
      toneIndex: resolveToneIndex(person, generation),
    }
  }

  return {
    panelColor: undefined,
    textColor: undefined,
    accentColor: visualMode === 'era' ? accentColorMap[person.accent] : accentColorMap[person.accent],
    toneIndex: resolveToneIndex(person, generation),
  }
}

function getRelationshipKindLabel(kind: TreeEditorRelationship['kind']) {
  if (kind === 'partner') return 'Партнёрская связь'
  if (kind === 'related') return 'Исследовательская связь'
  return 'Родитель → ребёнок'
}

export function createEditorNodes(
  persons: TreePerson[],
  selectedPersonId: string | null,
  pulsingPersonId: string | null = null,
  visualMode: EditorVisualMode = 'accent',
  generationByPerson: Map<string, number> = new Map(),
  autoColorNodes = false,
  mobileNodeTouchHandlers?: {
    onStart?: (personId: string, event: TouchEvent<HTMLDivElement>) => void
    onMove?: (personId: string, event: TouchEvent<HTMLDivElement>) => void
    onEnd?: (personId: string, event: TouchEvent<HTMLDivElement>) => void
  },
): Node<CompactPersonNodeData>[] {
  return persons.map((person) => ({
    id: person.id,
    type: 'compactPerson',
    position: { x: person.x, y: person.y },
    dragHandle: '.modern-node',
    zIndex: person.id === selectedPersonId ? 50 : person.id === pulsingPersonId ? 40 : 1,
    initialWidth: EDITOR_NODE_WIDTH,
    initialHeight: EDITOR_NODE_HEIGHT,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    handles: [
      {
        id: 'target-top',
        type: 'target',
        position: Position.Top,
        x: (EDITOR_NODE_WIDTH - HANDLE_SIZE) / 2,
        y: 0,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
      },
      {
        id: 'source-bottom',
        type: 'source',
        position: Position.Bottom,
        x: (EDITOR_NODE_WIDTH - HANDLE_SIZE) / 2,
        y: EDITOR_NODE_HEIGHT - HANDLE_SIZE,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
      },
    ],
    data: {
      label: person.label,
      accent: person.accent,
      researchStatus: person.researchStatus,
      selected: person.id === selectedPersonId,
      pulsing: person.id === pulsingPersonId,
      visualMode,
      onMobileTouchStart: mobileNodeTouchHandlers?.onStart,
      onMobileTouchMove: mobileNodeTouchHandlers?.onMove,
      onMobileTouchEnd: mobileNodeTouchHandlers?.onEnd,
      ...resolveNodeAppearance(person, generationByPerson.get(person.id) ?? 0, visualMode, autoColorNodes),
    },
  }))
}

function createRelationshipEdge(
  relationship: TreeEditorRelationship,
  peopleById: Map<string, TreePerson>,
  visualMode: EditorVisualMode,
  settings: EditorViewSettings,
): Edge {
  const sourcePerson = peopleById.get(relationship.source)
  const targetPerson = peopleById.get(relationship.target)
  const sourceAppearance = sourcePerson ? resolveNodeAppearance(sourcePerson, 0, visualMode, settings.autoColorNodes) : null
  const fallbackStroke =
    relationship.kind === 'partner'
      ? '#cbb8a8'
      : relationship.kind === 'related'
        ? '#a1a8bc'
        : '#8ca58c'
  const stroke = sourceAppearance?.accentColor ?? fallbackStroke
  const lineThickness = clampLineThickness(settings.lineThickness)
  const label = sourcePerson && targetPerson ? `${sourcePerson.label} → ${targetPerson.label}` : getRelationshipKindLabel(relationship.kind)

  return {
    id: relationship.id,
    source: relationship.source,
    target: relationship.target,
    type: 'relationshipEdge',
    markerEnd:
      relationship.kind === 'parent-child'
        ? { type: MarkerType.ArrowClosed, color: stroke }
        : undefined,
    data: {
      label,
      helperText: getRelationshipKindLabel(relationship.kind),
      stroke,
      lineThickness,
      showLabel: settings.showRelationshipLabels,
      dashArray:
        relationship.kind === 'partner'
          ? '10 6'
          : relationship.kind === 'related'
            ? relationship.researchStatus === 'hypothesis'
              ? '4 7'
              : '9 6'
            : undefined,
      animated: relationship.kind === 'partner',
    },
  }
}

export function createEditorEdges(
  relationships: TreeEditorRelationship[],
  persons: TreePerson[],
  visualMode: EditorVisualMode = 'accent',
  settings: EditorViewSettings = defaultEditorViewSettings,
  selectedRelationshipId: string | null = null,
  selectedPersonId: string | null = null,
): Edge[] {
  const peopleById = new Map(persons.map((person) => [person.id, person]))
  return relationships.map((relationship) => {
    const edge = createRelationshipEdge(relationship, peopleById, visualMode, settings)
    return {
      ...edge,
      data: {
        ...(edge.data ?? {}),
        selected: relationship.id === selectedRelationshipId,
        connectedToSelectedPerson:
          selectedPersonId !== null &&
          (relationship.source === selectedPersonId || relationship.target === selectedPersonId),
      },
    }
  })
}

export function createAutoLayout(persons: TreePerson[], relationships: TreeEditorRelationship[], mode: AutoLayoutMode = 'auto1') {
  if (persons.length === 0) return persons

  const graph = buildAutoGraph(persons, relationships)
  const positioned = mode === 'auto2' ? applyAutoLayoutMode2(graph) : applyAutoLayoutMode1(graph)
  if (mode === 'auto1') {
    compactAuto1Rows(positioned)
  } else {
    compactAuto2Rows(positioned)
  }
  applyRowStagger(positioned, mode)
  resolveNodeCollisions(positioned, mode)
  if (mode === 'auto1') {
    compactAuto1Rows(positioned)
    resolveNodeCollisions(positioned, mode)
  } else {
    compactAuto2Rows(positioned)
    resolveAuto2Intersections(positioned)
    compactAuto2Rows(positioned)
  }

  return persons.map((person) => {
    const position = positioned.get(person.id)
    return position ? { ...person, x: position.x, y: position.y } : person
  })
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
  aliases: '',
  sources: '',
  researchStatus: 'confirmed',
  accent: 'blue',
  panelColor: '',
  textColor: '',
}

export const emptyTreeForm: TreeFormState = {
  title: '',
  surname: '',
  privacy: 'private',
}
