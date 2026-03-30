import { useEffect, useMemo, useRef, useState } from 'react'
import { Background, BackgroundVariant, ReactFlow, applyNodeChanges, type NodeChange, type ReactFlowInstance } from '@xyflow/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { CompactPersonNode } from '../components/CompactPersonNode'
import type { TreeEditorPayload, TreeEditorRelationship, TreePerson, TreeSummary } from '../types'
import { ArrowLeftIcon, FitIcon, GearIcon, PlusIcon, SearchIcon, SparkIcon, TuneIcon, ZoomInIcon, ZoomOutIcon } from '../ui/icons'
import { PersonListSidebar, PersonSidebar, RelationshipSidebar, TreeSidebar, type RelationshipRole } from './EditorSidebar'
import { EditorSettingsModal } from './EditorSettingsModal'
import { RelationshipEdge } from './RelationshipEdge'
import {
  type AutoLayoutMode,
  createAutoLayout,
  buildGenerationByPerson,
  createEditorEdges,
  createEditorNodes,
  defaultEditorViewSettings,
  EDITOR_NODE_HEIGHT,
  EDITOR_NODE_WIDTH,
  emptyPersonForm,
  emptyTreeForm,
  extractLayout,
  type EditorViewSettings,
  type PersonFormState,
  type TreeFormState,
} from './utils'

const compactNodeTypes = { compactPerson: CompactPersonNode }
const relationshipEdgeTypes = { relationshipEdge: RelationshipEdge }
const EDITOR_VIEW_SETTINGS_KEY = 'ftree-editor-view-settings'
const MOBILE_TOUCH_MOVE_THRESHOLD = 8
const MIN_ZOOM = 0.3
const MAX_ZOOM = 1.7
const MOBILE_INITIAL_ZOOM = 0.9
type TouchPointLike = { clientX: number; clientY: number }

type SavedLayoutMap = Record<string, { x: number; y: number }>

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function captureSavedLayout(sourcePersons: TreePerson[]): SavedLayoutMap {
  return Object.fromEntries(sourcePersons.map((person) => [person.id, { x: person.x, y: person.y }]))
}

export function EditorPage({ trees, reloadTrees }: { trees: TreeSummary[]; reloadTrees: () => Promise<void> }) {
  const navigate = useNavigate()
  const { treeId = '' } = useParams()

  const [flow, setFlow] = useState<ReactFlowInstance | null>(null)
  const [zoomPercent, setZoomPercent] = useState(63)
  const [editorStatus, setEditorStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [editorTree, setEditorTree] = useState<TreeSummary | null>(null)
  const [persons, setPersons] = useState<TreePerson[]>([])
  const [savedLayout, setSavedLayout] = useState<SavedLayoutMap>({})
  const [relationships, setRelationships] = useState<TreeEditorRelationship[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [isPersonEditorOpen, setIsPersonEditorOpen] = useState(false)
  const [pulsingPersonId, setPulsingPersonId] = useState<string | null>(null)
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)
  const [returnToRelationshipId, setReturnToRelationshipId] = useState<string | null>(null)
  const [relationshipReturnViewport, setRelationshipReturnViewport] = useState<{
    x: number
    y: number
    zoom: number
  } | null>(null)
  const [isTreePanelOpen, setIsTreePanelOpen] = useState(false)
  const [isPersonListOpen, setIsPersonListOpen] = useState(false)
  const [shouldFitView, setShouldFitView] = useState(true)
  const [creatingPerson, setCreatingPerson] = useState(false)
  const [activeAutoMode, setActiveAutoMode] = useState<AutoLayoutMode>('auto1')
  const [activeLayoutPreset, setActiveLayoutPreset] = useState<'relayout' | AutoLayoutMode>('relayout')
  const [autoLayouting, setAutoLayouting] = useState(false)
  const [savingPerson, setSavingPerson] = useState(false)
  const [savingTree, setSavingTree] = useState(false)
  const [linkingRelationship, setLinkingRelationship] = useState(false)
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null)
  const [savingRelationshipPanel, setSavingRelationshipPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [viewSettings, setViewSettings] = useState<EditorViewSettings>(() => {
    if (typeof window === 'undefined') return defaultEditorViewSettings

    try {
      const saved = window.localStorage.getItem(EDITOR_VIEW_SETTINGS_KEY)
      return saved ? { ...defaultEditorViewSettings, ...(JSON.parse(saved) as Partial<EditorViewSettings>) } : defaultEditorViewSettings
    } catch {
      return defaultEditorViewSettings
    }
  })
  const [personError, setPersonError] = useState('')
  const [treeError, setTreeError] = useState('')
  const [relationshipError, setRelationshipError] = useState('')
  const [relationshipPanelError, setRelationshipPanelError] = useState('')
  const [personForm, setPersonForm] = useState<PersonFormState>(emptyPersonForm)
  const [personFormOwnerId, setPersonFormOwnerId] = useState<string | null>(null)
  const [treeForm, setTreeForm] = useState<TreeFormState>(emptyTreeForm)
  const [relationshipForm, setRelationshipForm] = useState<{
    targetId: string
    role: RelationshipRole
    note: string
    researchStatus: TreePerson['researchStatus']
  }>({
    targetId: '',
    role: 'child',
    note: '',
    researchStatus: 'confirmed',
  })
  const [relationshipPanelForm, setRelationshipPanelForm] = useState<{
    sourceId: string
    targetId: string
    kind: TreeEditorRelationship['kind']
    note: string
    researchStatus: TreeEditorRelationship['researchStatus']
  }>({
    sourceId: '',
    targetId: '',
    kind: 'parent-child',
    note: '',
    researchStatus: 'confirmed',
  })

  const fallbackTree = trees.find((entry) => entry.id === treeId) ?? null
  const currentTree = editorTree ?? fallbackTree
  const selectedPerson = persons.find((person) => person.id === selectedPersonId) ?? null
  const selectedRelationship = relationships.find((relationship) => relationship.id === selectedRelationshipId) ?? null
  const visualMode = activeAutoMode === 'auto2' ? 'era' : 'accent'
  const previewPersons = useMemo(
    () =>
      selectedPersonId && personFormOwnerId === selectedPersonId
        ? persons.map((person) =>
            person.id === selectedPersonId
              ? {
                  ...person,
                  accent: personForm.accent,
                  researchStatus: personForm.researchStatus,
                  panelColor: personForm.panelColor,
                  textColor: personForm.textColor,
                }
              : person,
          )
        : persons,
    [personForm.accent, personForm.panelColor, personForm.researchStatus, personForm.textColor, personFormOwnerId, persons, selectedPersonId],
  )
  const generationByPerson = useMemo(() => buildGenerationByPerson(persons, relationships), [persons, relationships])
  const pulsingPersonTimeoutRef = useRef<number | null>(null)
  const selectedPersonIdRef = useRef<string | null>(null)
  const personFormOwnerIdRef = useRef<string | null>(null)
  const touchGestureRef = useRef<
    | {
        mode: 'pan' | 'pinch'
        startViewport: { x: number; y: number; zoom: number }
        startPoint?: { x: number; y: number }
        startDistance?: number
        startFlowPoint?: { x: number; y: number }
        edgeId?: string | null
        moved: boolean
      }
    | null
  >(null)
  const mobileNodeGestureRef = useRef<
    | {
        personId: string
        startPoint: { x: number; y: number }
        startFlowPoint: { x: number; y: number }
        startPerson: { x: number; y: number }
        lastPosition: { x: number; y: number }
        moved: boolean
      }
    | null
  >(null)
  const [isCoarsePointer, setIsCoarsePointer] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(pointer: coarse)').matches
  })
  const nodes = useMemo(
    () =>
      createEditorNodes(
        previewPersons,
        selectedPersonId,
        pulsingPersonId,
        visualMode,
        generationByPerson,
        viewSettings.autoColorNodes,
        {
          onStart: handleMobileNodeTouchStart,
          onMove: handleMobileNodeTouchMove,
          onEnd: handleMobileNodeTouchEnd,
        },
      ),
    [generationByPerson, previewPersons, pulsingPersonId, selectedPersonId, viewSettings.autoColorNodes, visualMode],
  )
  const edges = useMemo(
    () => createEditorEdges(relationships, persons, visualMode, viewSettings, selectedRelationshipId, selectedPersonId),
    [persons, relationships, selectedPersonId, selectedRelationshipId, viewSettings, visualMode],
  )
  const relationshipTargets = useMemo(() => persons.filter((person) => person.id !== selectedPersonId), [persons, selectedPersonId])
  const normalizedSearchQuery = useMemo(() => normalizeSearchText(searchQuery), [searchQuery])
  const searchResults = useMemo(() => {
    if (!normalizedSearchQuery) return []

    return [...persons]
      .map((person) => {
        const haystack = normalizeSearchText(
          [person.label, person.firstName, person.lastName, person.aliases, person.years, person.branch, person.place]
            .filter(Boolean)
            .join(' '),
        )

        return {
          person,
          startsWith: haystack.startsWith(normalizedSearchQuery) || normalizeSearchText(person.label).startsWith(normalizedSearchQuery),
          index: haystack.indexOf(normalizedSearchQuery),
        }
      })
      .filter((entry) => entry.index >= 0)
      .sort((left, right) => {
        if (left.startsWith !== right.startsWith) return left.startsWith ? -1 : 1
        if (left.index !== right.index) return left.index - right.index
        return left.person.label.localeCompare(right.person.label, 'ru')
      })
      .slice(0, 8)
      .map((entry) => entry.person)
  }, [normalizedSearchQuery, persons])
  const selectedConnections = useMemo(() => {
    if (!selectedPersonId) return []

    return relationships
      .filter((item) => item.source === selectedPersonId || item.target === selectedPersonId)
      .map((item) => {
        const otherId = item.source === selectedPersonId ? item.target : item.source
        const role: RelationshipRole =
          item.kind === 'partner' ? 'partner' : item.kind === 'related' ? 'related' : item.source === selectedPersonId ? 'child' : 'parent'

        return {
          id: item.id,
          kind: item.kind,
          label: persons.find((person) => person.id === otherId)?.label ?? 'Неизвестная персона',
          role,
          personId: otherId,
          note: item.note,
          researchStatus: item.researchStatus,
        }
      })
  }, [persons, relationships, selectedPersonId])

  useEffect(() => {
    let cancelled = false

    async function loadEditor() {
      if (!treeId) return

      setEditorStatus('loading')
      setSelectedPersonId(null)
      setIsPersonEditorOpen(false)
      setSelectedRelationshipId(null)
      setReturnToRelationshipId(null)
      setRelationshipReturnViewport(null)
      setEditingRelationshipId(null)
      setIsTreePanelOpen(false)
      setIsPersonListOpen(false)
      setActiveAutoMode('auto1')
      setActiveLayoutPreset('relayout')

      try {
        const response = await fetch(`/api/trees/${treeId}/editor`)
        if (!response.ok) throw new Error('Unable to load tree editor')

        const payload = (await response.json()) as TreeEditorPayload
        if (cancelled) return

        setEditorTree(payload.tree)
        setPersons(payload.persons)
        setSavedLayout(captureSavedLayout(payload.persons))
        setRelationships(payload.relationships)
        setEditorStatus('ready')
        setShouldFitView(true)
      } catch {
        if (cancelled) return

        setEditorStatus('error')
        setEditorTree(fallbackTree)
        setPersons([])
        setSavedLayout({})
        setRelationships([])
      }
    }

    void loadEditor()
    return () => {
      cancelled = true
    }
  }, [treeId])

  useEffect(() => {
    if (!flow) return
    setZoomPercent(Math.round(flow.getViewport().zoom * 100))
  }, [flow])

  useEffect(() => {
    if (!flow || !shouldFitView || persons.length === 0) return

    fitViewportToPersons(persons)
    window.setTimeout(() => {
      setZoomPercent(Math.round(flow.getViewport().zoom * 100))
      setShouldFitView(false)
    }, 320)
  }, [flow, persons, shouldFitView])

  useEffect(() => {
    setPersonFormOwnerId(selectedPerson?.id ?? null)
    setPersonForm(
      selectedPerson
        ? {
            firstName: selectedPerson.firstName,
            lastName: selectedPerson.lastName,
            years: selectedPerson.years,
            place: selectedPerson.place,
            branch: selectedPerson.branch,
            note: selectedPerson.note,
            aliases: selectedPerson.aliases,
            sources: selectedPerson.sources,
            researchStatus: selectedPerson.researchStatus,
            accent: selectedPerson.accent,
            panelColor: selectedPerson.panelColor,
            textColor: selectedPerson.textColor,
          }
        : emptyPersonForm,
    )
  }, [selectedPerson])

  useEffect(() => {
    selectedPersonIdRef.current = selectedPersonId
  }, [selectedPersonId])

  useEffect(() => {
    personFormOwnerIdRef.current = personFormOwnerId
  }, [personFormOwnerId])

  useEffect(() => {
    setTreeForm(currentTree ? { title: currentTree.title, surname: currentTree.surname, privacy: currentTree.privacy } : emptyTreeForm)
  }, [currentTree])

  useEffect(() => {
    setEditingRelationshipId(null)
    setRelationshipError('')
  }, [selectedPersonId])

  useEffect(() => {
    if (!selectedRelationship) {
      setRelationshipPanelError('')
      return
    }

    setRelationshipPanelForm({
      sourceId: selectedRelationship.source,
      targetId: selectedRelationship.target,
      kind: selectedRelationship.kind,
      note: selectedRelationship.note,
      researchStatus: selectedRelationship.researchStatus,
    })
    setRelationshipPanelError('')
  }, [selectedRelationship])

  useEffect(() => {
    setRelationshipForm((current) => ({
      role: current.role,
      targetId: relationshipTargets.some((person) => person.id === current.targetId) ? current.targetId : relationshipTargets[0]?.id ?? '',
      note: current.note,
      researchStatus: current.researchStatus,
    }))
  }, [relationshipTargets])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(EDITOR_VIEW_SETTINGS_KEY, JSON.stringify(viewSettings))
  }, [viewSettings])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(pointer: coarse)')
    const updatePointerMode = () => setIsCoarsePointer(mediaQuery.matches)

    updatePointerMode()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePointerMode)
      return () => mediaQuery.removeEventListener('change', updatePointerMode)
    }

    mediaQuery.addListener(updatePointerMode)
    return () => mediaQuery.removeListener(updatePointerMode)
  }, [])

  useEffect(
    () => () => {
      if (pulsingPersonTimeoutRef.current !== null) {
        window.clearTimeout(pulsingPersonTimeoutRef.current)
      }
    },
    [],
  )

  if (!treeId) return <Navigate to="/trees" replace />

  function syncZoom() {
    if (!flow) return
    setZoomPercent(Math.round(flow.getViewport().zoom * 100))
  }

  function clampZoom(value: number) {
    return Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM)
  }

  function getTouchPoint(touch: TouchPointLike) {
    return { x: touch.clientX, y: touch.clientY }
  }

  function getTouchDistance(first: TouchPointLike, second: TouchPointLike) {
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
  }

  function getTouchMidpoint(first: TouchPointLike, second: TouchPointLike) {
    return {
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2,
    }
  }

  function beginCanvasTouchGesture(event: React.TouchEvent<HTMLDivElement>) {
    if (!isCoarsePointer || !flow) return

    const target = event.target instanceof HTMLElement ? event.target : null
    if (target?.closest('.editor-sidebar, .editor-status-card, .editor-settings-backdrop')) {
      touchGestureRef.current = null
      return
    }

    if (target?.closest('.react-flow__node')) {
      touchGestureRef.current = null
      return
    }

    if (event.touches.length >= 2) {
      const first = event.touches[0]
      const second = event.touches[1]
      const midpoint = getTouchMidpoint(first, second)
      touchGestureRef.current = {
        mode: 'pinch',
        startViewport: flow.getViewport(),
        startDistance: Math.max(getTouchDistance(first, second), 1),
        startFlowPoint: flow.screenToFlowPosition(midpoint),
        moved: true,
      }
      return
    }

    if (event.touches.length !== 1) return

    const edgeElement = target?.closest('.react-flow__edge')
    touchGestureRef.current = {
      mode: 'pan',
      startViewport: flow.getViewport(),
      startPoint: getTouchPoint(event.touches[0]),
      edgeId: edgeElement?.getAttribute('data-id'),
      moved: false,
    }
  }

  function moveCanvasTouchGesture(event: React.TouchEvent<HTMLDivElement>) {
    if (!isCoarsePointer || !flow || !touchGestureRef.current) return

    const gesture = touchGestureRef.current

    if (gesture.mode === 'pinch') {
      if (event.touches.length < 2 || !gesture.startDistance || !gesture.startFlowPoint) return

      const first = event.touches[0]
      const second = event.touches[1]
      const midpoint = getTouchMidpoint(first, second)
      const distance = Math.max(getTouchDistance(first, second), 1)
      const zoom = clampZoom(gesture.startViewport.zoom * (distance / gesture.startDistance))

      gesture.moved = true
      void flow.setViewport({
        x: midpoint.x - gesture.startFlowPoint.x * zoom,
        y: midpoint.y - gesture.startFlowPoint.y * zoom,
        zoom,
      })
      return
    }

    if (event.touches.length === 0 || !gesture.startPoint) return

    const current = getTouchPoint(event.touches[0])
    const deltaX = current.x - gesture.startPoint.x
    const deltaY = current.y - gesture.startPoint.y

    if (!gesture.moved && Math.hypot(deltaX, deltaY) < MOBILE_TOUCH_MOVE_THRESHOLD) {
      return
    }

    gesture.moved = true
    void flow.setViewport({
      x: gesture.startViewport.x + deltaX,
      y: gesture.startViewport.y + deltaY,
      zoom: gesture.startViewport.zoom,
    })
  }

  function endCanvasTouchGesture() {
    if (!isCoarsePointer) return

    const gesture = touchGestureRef.current
    touchGestureRef.current = null

    if (!gesture) return
    if (!gesture.moved && gesture.edgeId) {
      openRelationshipSidebar(gesture.edgeId)
      return
    }

    if (gesture.moved) {
      syncZoom()
    }
  }

  function handleMobileNodeTouchStart(personId: string, event: React.TouchEvent<HTMLDivElement>) {
    if (!isCoarsePointer || !flow || event.touches.length !== 1) return

    const person = persons.find((item) => item.id === personId)
    if (!person) return

    const touch = event.touches[0]
    mobileNodeGestureRef.current = {
      personId,
      startPoint: getTouchPoint(touch),
      startFlowPoint: flow.screenToFlowPosition(getTouchPoint(touch)),
      startPerson: { x: person.x, y: person.y },
      lastPosition: { x: person.x, y: person.y },
      moved: false,
    }

    setSelectedPersonId(personId)
    setIsPersonEditorOpen(false)
    setSelectedRelationshipId(null)
    setIsTreePanelOpen(false)
    setIsPersonListOpen(false)
    event.stopPropagation()
  }

  function handleMobileNodeTouchMove(personId: string, event: React.TouchEvent<HTMLDivElement>) {
    if (!isCoarsePointer || !flow || event.touches.length !== 1) return

    const gesture = mobileNodeGestureRef.current
    if (!gesture || gesture.personId !== personId) return

    const touch = event.touches[0]
    const currentPoint = getTouchPoint(touch)
    const currentFlowPoint = flow.screenToFlowPosition(currentPoint)
    const deltaX = currentPoint.x - gesture.startPoint.x
    const deltaY = currentPoint.y - gesture.startPoint.y

    if (!gesture.moved && Math.hypot(deltaX, deltaY) < MOBILE_TOUCH_MOVE_THRESHOLD) {
      event.stopPropagation()
      return
    }

    const nextPosition = {
      x: Math.round(gesture.startPerson.x + (currentFlowPoint.x - gesture.startFlowPoint.x)),
      y: Math.round(gesture.startPerson.y + (currentFlowPoint.y - gesture.startFlowPoint.y)),
    }

    gesture.moved = true
    gesture.lastPosition = nextPosition
    setPersons((current) =>
      current.map((person) => (person.id === personId ? { ...person, x: nextPosition.x, y: nextPosition.y } : person)),
    )
    event.stopPropagation()
  }

  function handleMobileNodeTouchEnd(personId: string, event: React.TouchEvent<HTMLDivElement>) {
    if (!isCoarsePointer) return

    const gesture = mobileNodeGestureRef.current
    mobileNodeGestureRef.current = null
    if (!gesture || gesture.personId !== personId) return

    if (gesture.moved) {
      setSelectedPersonId(personId)
      setIsPersonEditorOpen(false)
      setSelectedRelationshipId(null)
      setIsTreePanelOpen(false)
      setIsPersonListOpen(false)
    } else if (selectedPersonId === personId && !isPersonEditorOpen) {
      setIsPersonEditorOpen(true)
    } else {
      setSelectedPersonId(personId)
      setIsPersonEditorOpen(false)
      setSelectedRelationshipId(null)
      setIsTreePanelOpen(false)
      setIsPersonListOpen(false)
    }

    event.stopPropagation()
  }

  function pulsePerson(personId: string) {
    if (pulsingPersonTimeoutRef.current !== null) {
      window.clearTimeout(pulsingPersonTimeoutRef.current)
      pulsingPersonTimeoutRef.current = null
    }

    setPulsingPersonId(null)

    window.setTimeout(() => {
      setPulsingPersonId(personId)
      pulsingPersonTimeoutRef.current = window.setTimeout(() => {
        setPulsingPersonId((current) => (current === personId ? null : current))
        pulsingPersonTimeoutRef.current = null
      }, 1500)
    }, 0)
  }

  function fitViewportToPersons(targetPersons: TreePerson[]) {
    if (!flow || targetPersons.length === 0) return

    const minX = Math.min(...targetPersons.map((person) => person.x))
    const minY = Math.min(...targetPersons.map((person) => person.y))
    const maxX = Math.max(...targetPersons.map((person) => person.x + EDITOR_NODE_WIDTH))
    const maxY = Math.max(...targetPersons.map((person) => person.y + EDITOR_NODE_HEIGHT))

    void flow.fitBounds(
      {
        x: minX - 120,
        y: minY - 120,
        width: Math.max(maxX - minX + 240, 320),
        height: Math.max(maxY - minY + 240, 220),
      },
      { duration: 260, padding: 0.1 },
    )

    window.setTimeout(() => {
      if (!flow) return

      if (isCoarsePointer && flow.getZoom() < MOBILE_INITIAL_ZOOM) {
        const boundsCenterX = minX + (maxX - minX) / 2
        const boundsCenterY = minY + (maxY - minY) / 2
        const nextZoom = MOBILE_INITIAL_ZOOM

        void flow.setViewport(
          {
            x: window.innerWidth / 2 - boundsCenterX * nextZoom,
            y: window.innerHeight / 2 - boundsCenterY * nextZoom,
            zoom: nextZoom,
          },
          { duration: 180 },
        )
        window.setTimeout(syncZoom, 220)
        return
      }

      syncZoom()
    }, 320)
  }

  function getViewportCenterPosition() {
    if (!flow) {
      return { x: 420, y: 300 }
    }

    const centerPoint = flow.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    return {
      x: Math.round(centerPoint.x - EDITOR_NODE_WIDTH / 2),
      y: Math.round(centerPoint.y - EDITOR_NODE_HEIGHT / 2),
    }
  }

  function centerPerson(personId: string, explicitPerson?: TreePerson, options?: { openEditor?: boolean; keepPersonList?: boolean }) {
    const person = explicitPerson ?? persons.find((item) => item.id === personId)
    if (!person) return

    setIsTreePanelOpen(false)

    if (options?.openEditor) {
      setSelectedPersonId(personId)
      setIsPersonEditorOpen(true)
      setIsPersonListOpen(false)
    } else if (options?.keepPersonList) {
      setSelectedPersonId(personId)
      setIsPersonEditorOpen(false)
      setIsPersonListOpen(true)
      pulsePerson(personId)
    } else {
      setSelectedPersonId(personId)
      setIsPersonEditorOpen(false)
      setIsPersonListOpen(false)
    }

    if (!flow) return

    void flow.setCenter(person.x + EDITOR_NODE_WIDTH / 2, person.y + EDITOR_NODE_HEIGHT / 2, {
      duration: 320,
      zoom: Math.max(flow.getZoom(), 0.95),
    })

    window.setTimeout(syncZoom, 360)
  }

  function focusPerson(personId: string, explicitPerson?: TreePerson, openEditor = false) {
    centerPerson(personId, explicitPerson, { openEditor, keepPersonList: !openEditor })
  }

  function focusSearchPerson(personId: string) {
    const person = persons.find((item) => item.id === personId)
    if (!person) return

    setSearchQuery('')
    setSelectedRelationshipId(null)
    centerPerson(personId, person, isCoarsePointer ? { openEditor: false, keepPersonList: false } : { openEditor: true })
  }

  function openRelationshipSidebar(relationshipId: string) {
    setSelectedPersonId(null)
    setIsPersonEditorOpen(false)
    setSelectedRelationshipId(relationshipId)
    setReturnToRelationshipId(null)
    setRelationshipReturnViewport(null)
    setIsTreePanelOpen(false)
    setIsPersonListOpen(false)
    setEditingRelationshipId(null)
  }

  function editPersonFromRelationship(personId: string) {
    if (selectedRelationshipId) {
      setReturnToRelationshipId(selectedRelationshipId)
      if (flow) {
        setRelationshipReturnViewport(flow.getViewport())
      }
    }
    setSelectedRelationshipId(null)
    setIsPersonEditorOpen(true)
    focusPerson(personId, undefined, true)
  }

  function returnToRelationship() {
    if (!returnToRelationshipId) return

    const relationshipId = returnToRelationshipId
    setSelectedPersonId(null)
    setIsPersonEditorOpen(false)
    setSelectedRelationshipId(relationshipId)
    setReturnToRelationshipId(null)
    setIsTreePanelOpen(false)
    setIsPersonListOpen(false)
    setEditingRelationshipId(null)

    if (flow && relationshipReturnViewport) {
      void flow.setViewport(relationshipReturnViewport, { duration: 320 })
      window.setTimeout(syncZoom, 360)
    }

    setRelationshipReturnViewport(null)
  }

  function updatePersonPositions(changes: NodeChange[]) {
    setPersons((current) => {
      const changedNodes = applyNodeChanges(changes, createEditorNodes(current, selectedPersonId, pulsingPersonId))
      return current.map((person) => {
        const node = changedNodes.find((item) => item.id === person.id)
        return node ? { ...person, x: Math.round(node.position.x), y: Math.round(node.position.y) } : person
      })
    })
  }

  async function addCompactPerson() {
    if (!treeId || creatingPerson) return

    setCreatingPerson(true)
    setPersonError('')

    try {
      const centerPosition = getViewportCenterPosition()
      const response = await fetch(`/api/trees/${treeId}/persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(centerPosition),
      })

      if (!response.ok) throw new Error('Unable to create person')

      const created = (await response.json()) as TreePerson
      setPersons((current) => [...current, created])
      setSavedLayout((current) => ({ ...current, [created.id]: { x: created.x, y: created.y } }))
      setSelectedPersonId(created.id)
      setIsPersonEditorOpen(true)
      setIsTreePanelOpen(false)
      setIsPersonListOpen(false)
      setSearchQuery('')
      setShouldFitView(false)
      window.setTimeout(() => focusPerson(created.id, created, true), 40)
      await reloadTrees()
    } catch {
      setEditorStatus('error')
    } finally {
      setCreatingPerson(false)
    }
  }

  async function deletePerson(personId: string) {
    if (!treeId) return

    const person = persons.find((item) => item.id === personId)
    const personLabel = person?.label ?? 'эту персону'

    if (!window.confirm(`Удалить ${personLabel}? Связи с этой персоной тоже будут удалены.`)) {
      return
    }

    try {
      const response = await fetch(`/api/trees/${treeId}/persons/${personId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Unable to delete person')

      setPersons((current) => current.filter((item) => item.id !== personId))
      setSavedLayout((current) => {
        const nextLayout = { ...current }
        delete nextLayout[personId]
        return nextLayout
      })
      setRelationships((current) => current.filter((item) => item.source !== personId && item.target !== personId))

      if (selectedPersonId === personId) {
        setSelectedPersonId(null)
        setIsPersonEditorOpen(false)
      }

      if (editingRelationshipId) {
        setEditingRelationshipId(null)
      }

      if (selectedRelationshipId) {
        const removedRelationship = relationships.find((item) => item.id === selectedRelationshipId)
        if (removedRelationship && (removedRelationship.source === personId || removedRelationship.target === personId)) {
          setSelectedRelationshipId(null)
        }
      }

      await reloadTrees()
    } catch {
      setPersonError('Не удалось удалить персону.')
    }
  }

  async function saveSelectedPerson() {
    if (!treeId || !selectedPerson || savingPerson) return

    setSavingPerson(true)
    setPersonError('')

    try {
      const response = await fetch(`/api/trees/${treeId}/persons/${selectedPerson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personForm),
      })

      if (!response.ok) throw new Error('Unable to save person')

      const updated = (await response.json()) as TreePerson
      setPersons((current) => current.map((person) => (person.id === updated.id ? updated : person)))
      await reloadTrees()
    } catch {
      setPersonError('Не удалось сохранить изменения персоны.')
    } finally {
      setSavingPerson(false)
    }
  }

  async function commitPersonColors(personId: string, patch: Pick<PersonFormState, 'panelColor' | 'textColor'>) {
    if (!treeId) return

    const previousPerson = persons.find((person) => person.id === personId)
    if (!previousPerson) return

    setPersonError('')
    setPersons((current) =>
      current.map((person) =>
        person.id === personId
          ? {
              ...person,
              panelColor: patch.panelColor,
              textColor: patch.textColor,
            }
          : person,
      ),
    )

    try {
      const response = await fetch(`/api/trees/${treeId}/persons/${personId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!response.ok) throw new Error('Unable to save person colors')

      const updated = (await response.json()) as TreePerson
      setPersons((current) => current.map((person) => (person.id === updated.id ? updated : person)))
      if (selectedPersonIdRef.current === updated.id && personFormOwnerIdRef.current === updated.id) {
        setPersonForm((current) => ({
          ...current,
          panelColor: updated.panelColor,
          textColor: updated.textColor,
        }))
      }
    } catch {
      setPersons((current) =>
        current.map((person) =>
          person.id === personId
            ? {
                ...person,
                panelColor: previousPerson.panelColor,
                textColor: previousPerson.textColor,
              }
            : person,
        ),
      )
      if (selectedPersonIdRef.current === personId && personFormOwnerIdRef.current === personId) {
        setPersonForm((current) => ({
          ...current,
          panelColor: previousPerson.panelColor,
          textColor: previousPerson.textColor,
        }))
      }
      setPersonError('Не удалось автоматически сохранить цвета персоны.')
    }
  }

  async function saveTreeSettings() {
    if (!treeId || savingTree) return

    setSavingTree(true)
    setTreeError('')

    try {
      const response = await fetch(`/api/trees/${treeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treeForm),
      })

      if (!response.ok) throw new Error('Unable to save tree')

      const layoutResponse = await fetch(`/api/trees/${treeId}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persons: extractLayout(persons) }),
      })

      if (!layoutResponse.ok) throw new Error('Unable to save tree layout')

      setEditorTree((await response.json()) as TreeSummary)
      setSavedLayout(captureSavedLayout(persons))
      await reloadTrees()
    } catch {
      setTreeError('Не удалось сохранить метаданные дерева.')
    } finally {
      setSavingTree(false)
    }
  }

  async function shareCurrentTree() {
    if (!treeId || !currentTree) return

    if (currentTree.privacy === 'public') return

    try {
      const response = await fetch(`/api/trees/${treeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTree.title,
          surname: currentTree.surname,
          privacy: 'public',
        }),
      })

      if (!response.ok) throw new Error('Unable to publish tree')

      const updated = (await response.json()) as TreeSummary
      setEditorTree(updated)
      setTreeForm((current) => ({ ...current, privacy: 'public' }))
      void reloadTrees()
    } catch {
      setTreeError('Не удалось подготовить публичную ссылку для дерева.')
      throw new Error('Unable to prepare share link')
    }
  }

  function startRelationshipEdit(relationshipId: string) {
    const connection = selectedConnections.find((item) => item.id === relationshipId)
    if (!connection) return

    setRelationshipForm({
      targetId: connection.personId,
      role: connection.role,
      note: connection.note,
      researchStatus: connection.researchStatus,
    })
    setEditingRelationshipId(relationshipId)
    setRelationshipError('')
  }

  function cancelRelationshipEdit() {
    setEditingRelationshipId(null)
    setRelationshipError('')
    setRelationshipForm((current) => ({
      role: current.role,
      targetId: relationshipTargets[0]?.id ?? '',
      note: '',
      researchStatus: current.researchStatus,
    }))
  }

  async function createRelationship() {
    if (!treeId || !selectedPerson || !relationshipForm.targetId || linkingRelationship) return

    setLinkingRelationship(true)
    setRelationshipError('')

    try {
      const payload =
        relationshipForm.role === 'parent'
          ? {
              sourceId: relationshipForm.targetId,
              targetId: selectedPerson.id,
              kind: 'parent-child' as const,
              note: relationshipForm.note,
              researchStatus: relationshipForm.researchStatus,
            }
          : relationshipForm.role === 'child'
            ? {
                sourceId: selectedPerson.id,
                targetId: relationshipForm.targetId,
                kind: 'parent-child' as const,
                note: relationshipForm.note,
                researchStatus: relationshipForm.researchStatus,
              }
            : relationshipForm.role === 'partner'
              ? {
                  sourceId: selectedPerson.id,
                  targetId: relationshipForm.targetId,
                  kind: 'partner' as const,
                  note: relationshipForm.note,
                  researchStatus: relationshipForm.researchStatus,
                }
              : {
                  sourceId: selectedPerson.id,
                  targetId: relationshipForm.targetId,
                  kind: 'related' as const,
                  note: relationshipForm.note,
                  researchStatus: relationshipForm.researchStatus,
                }

      const response = await fetch(
        editingRelationshipId ? `/api/trees/${treeId}/relationships/${editingRelationshipId}` : `/api/trees/${treeId}/relationships`,
        {
          method: editingRelationshipId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) throw new Error('Unable to save relationship')

      const saved = (await response.json()) as TreeEditorRelationship
      setRelationships((current) =>
        editingRelationshipId ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved],
      )
      setEditingRelationshipId(null)
      setRelationshipForm((current) => ({
        role: current.role,
        targetId: current.targetId,
        note: '',
        researchStatus: current.researchStatus,
      }))
      await reloadTrees()
    } catch {
      setRelationshipError(
        editingRelationshipId
          ? 'Не удалось обновить связь. Проверьте выбранную персону и тип связи.'
          : 'Связь уже существует или не может быть создана.',
      )
    } finally {
      setLinkingRelationship(false)
    }
  }

  async function saveSelectedRelationship() {
    if (!treeId || !selectedRelationship || savingRelationshipPanel) return

    if (!relationshipPanelForm.sourceId || !relationshipPanelForm.targetId || relationshipPanelForm.sourceId === relationshipPanelForm.targetId) {
      setRelationshipPanelError('У связи должны быть выбраны две разные персоны.')
      return
    }

    setSavingRelationshipPanel(true)
    setRelationshipPanelError('')

    try {
      const response = await fetch(`/api/trees/${treeId}/relationships/${selectedRelationship.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationshipPanelForm),
      })

      if (!response.ok) throw new Error('Unable to save relationship')

      const updated = (await response.json()) as TreeEditorRelationship
      setRelationships((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      await reloadTrees()
    } catch {
      setRelationshipPanelError('Не удалось сохранить связь. Проверьте выбранных персон и параметры связи.')
    } finally {
      setSavingRelationshipPanel(false)
    }
  }

  async function deleteRelationship(relationshipId: string) {
    if (!treeId) return

    if (!window.confirm('Удалить эту связь?')) {
      return
    }

    setRelationshipError('')

    try {
      const response = await fetch(`/api/trees/${treeId}/relationships/${relationshipId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Unable to delete relationship')

      setRelationships((current) => current.filter((item) => item.id !== relationshipId))
      if (selectedRelationshipId === relationshipId) {
        setSelectedRelationshipId(null)
      }
      if (editingRelationshipId === relationshipId) {
        cancelRelationshipEdit()
      }
      await reloadTrees()
    } catch {
      setRelationshipError('Не удалось удалить связь.')
    }
  }

  function relayout() {
    setActiveLayoutPreset('relayout')
    const nextPersons = persons.map((person) => {
      const savedPosition = savedLayout[person.id]
      return savedPosition ? { ...person, x: savedPosition.x, y: savedPosition.y } : person
    })

    setPersons(nextPersons)
    setShouldFitView(true)
  }

  async function autoRelayout(mode: AutoLayoutMode) {
    if (persons.length === 0 || autoLayouting) return

    setAutoLayouting(true)
    setActiveAutoMode(mode)
    setActiveLayoutPreset(mode)

    try {
      const nextPersons = createAutoLayout(persons, relationships, mode)
      setPersons(nextPersons)
      setSelectedPersonId(null)
      setIsPersonListOpen(false)
      setIsTreePanelOpen(false)
      setShouldFitView(true)
    } finally {
      setAutoLayouting(false)
    }
  }

  function openSettingsPanel() {
    setIsTreePanelOpen(false)
    setIsPersonListOpen(false)
    setIsPersonEditorOpen(false)
    setSelectedRelationshipId(null)
    setIsSettingsOpen(true)
  }

  function toggleTreePanel() {
    setSelectedPersonId(null)
    setIsPersonEditorOpen(false)
    setSelectedRelationshipId(null)
    setIsPersonListOpen(false)
    setIsTreePanelOpen((current) => !current)
  }

  return (
    <section className="editor-screen">
      <div className="editor-top editor-top--left">
        <button className="floating-button" onClick={() => navigate('/trees')} type="button" aria-label="Назад">
          <ArrowLeftIcon />
        </button>
      </div>

      <div className="editor-top editor-top--center">
        <div className="editor-toolbar-stack">
          <div className="floating-toolbar">
          <button
            onClick={(event) => {
              event.stopPropagation()
              void addCompactPerson()
            }}
            type="button"
          >
            <PlusIcon />
            <span>{creatingPerson ? 'Создаём...' : 'Персона'}</span>
          </button>

          <div className="floating-toolbar__divider" />

          <button
            onClick={(event) => {
              event.stopPropagation()
              relayout()
            }}
            type="button"
            className={activeLayoutPreset === 'relayout' ? 'is-active' : ''}
          >
            <SparkIcon />
            <span>Раскладка</span>
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation()
              void autoRelayout('auto1')
            }}
            type="button"
            disabled={autoLayouting}
            className={activeLayoutPreset === 'auto1' ? 'is-active' : ''}
          >
            <SparkIcon />
            <span>{autoLayouting && activeAutoMode === 'auto1' ? 'Авто 1...' : 'Авто 1'}</span>
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation()
              void autoRelayout('auto2')
            }}
            type="button"
            disabled={autoLayouting}
            className={activeLayoutPreset === 'auto2' ? 'is-active' : ''}
          >
            <SparkIcon />
            <span>{autoLayouting && activeAutoMode === 'auto2' ? 'Авто 2...' : 'Авто 2'}</span>
          </button>

          <div className="floating-toolbar__divider" />

          <button
            onClick={() => {
              if (!flow) return
              void flow.zoomIn({ duration: 180 })
              window.setTimeout(syncZoom, 220)
            }}
            type="button"
            aria-label="Увеличить"
          >
            <ZoomInIcon />
          </button>

          <button
            onClick={() => {
              if (!flow) return
              void flow.zoomOut({ duration: 180 })
              window.setTimeout(syncZoom, 220)
            }}
            type="button"
            aria-label="Уменьшить"
          >
            <ZoomOutIcon />
          </button>

          <button onClick={() => fitViewportToPersons(persons)} type="button" aria-label="Вписать">
            <FitIcon />
          </button>
          </div>

          <div className="editor-search-shell">
            <label className="editor-search" aria-label="Быстрый поиск персон">
              <SearchIcon />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Быстрый поиск по ФИО"
                type="search"
              />
            </label>

            {normalizedSearchQuery && (
              <div className="editor-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((person) => (
                    <button
                      key={person.id}
                      className="editor-search-results__item"
                      onClick={(event) => {
                        event.stopPropagation()
                        focusSearchPerson(person.id)
                      }}
                      type="button"
                    >
                      <strong>{person.label}</strong>
                      <span>{person.years || person.branch || person.place || 'Перейти к персоне'}</span>
                    </button>
                  ))
                ) : (
                  <div className="editor-search-results__empty">Ничего похожего не найдено</div>
                )}
              </div>
            )}
          </div>

          <div className="editor-mobile-actions">
            <button className="floating-action" onClick={openSettingsPanel} type="button">
              <TuneIcon />
              <span>{'\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438'}</span>
            </button>
            <button className="floating-action" onClick={toggleTreePanel} type="button">
              <GearIcon />
              <span>{'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="editor-top editor-top--right">
        <button className="floating-action" onClick={openSettingsPanel} type="button">
          <TuneIcon />
          <span>Настройки</span>
        </button>
        <button className="floating-action" onClick={toggleTreePanel} type="button">
          <GearIcon />
          <span>Действия</span>
        </button>
      </div>

      <div
        className="editor-canvas"
        onTouchStartCapture={beginCanvasTouchGesture}
        onTouchMoveCapture={moveCanvasTouchGesture}
        onTouchEndCapture={endCanvasTouchGesture}
        onTouchCancelCapture={endCanvasTouchGesture}
      >
        <ReactFlow
          fitView
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          nodes={nodes}
          edges={edges}
          nodeTypes={compactNodeTypes}
          edgeTypes={relationshipEdgeTypes}
          onInit={setFlow}
          onMoveEnd={syncZoom}
          onNodeDragStart={(_, node) => {
            if (isCoarsePointer) return
            setSelectedPersonId(node.id)
            setIsPersonEditorOpen(false)
            setSelectedRelationshipId(null)
            setIsTreePanelOpen(false)
            setIsPersonListOpen(false)
          }}
          onNodeClick={(_, node) => {
            if (isCoarsePointer) return
            setSelectedPersonId(node.id)
            setIsPersonEditorOpen(true)
            setSelectedRelationshipId(null)
            setIsTreePanelOpen(false)
            setIsPersonListOpen(false)
          }}
          onEdgeClick={(_, edge) => openRelationshipSidebar(edge.id)}
          onNodesChange={updatePersonPositions}
          onPaneClick={() => {
            setSelectedPersonId(null)
            setIsPersonEditorOpen(false)
            setSelectedRelationshipId(null)
            setIsPersonListOpen(false)
          }}
          nodeDragThreshold={0}
          connectionDragThreshold={9999}
          nodesDraggable={!isCoarsePointer}
          nodesConnectable={false}
          panOnDrag={!isCoarsePointer}
          zoomOnScroll={!isCoarsePointer}
          zoomOnPinch={!isCoarsePointer}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e0cdbb" gap={18} size={1.2} variant={BackgroundVariant.Dots} />
        </ReactFlow>

        {editorStatus !== 'ready' && (
          <div className="editor-status-card">
            <strong>{editorStatus === 'loading' ? 'Загружаем дерево' : 'Не удалось открыть дерево'}</strong>
            <span>{editorStatus === 'loading' ? 'Подтягиваем персон и связи из базы проекта.' : 'Проверьте backend или обновите страницу.'}</span>
          </div>
        )}

        {selectedPerson && isPersonEditorOpen && (
          <PersonSidebar
            key={selectedPerson.id}
            selectedPerson={selectedPerson}
            personForm={personForm}
            savingPerson={savingPerson}
            personError={personError}
            relationshipError={relationshipError}
            linkingRelationship={linkingRelationship}
            editingRelationshipId={editingRelationshipId}
            relationshipTargets={relationshipTargets}
            relationshipForm={relationshipForm}
            selectedConnections={selectedConnections}
            onClose={() => {
              setSelectedPersonId(null)
              setIsPersonEditorOpen(false)
            }}
            onReturnToRelationship={returnToRelationshipId ? returnToRelationship : undefined}
            onPersonFormChange={(patch) => setPersonForm((current) => ({ ...current, ...patch }))}
            onCommitPersonColors={(personId, patch) => void commitPersonColors(personId, patch)}
            onRelationshipFormChange={(patch) => setRelationshipForm((current) => ({ ...current, ...patch }))}
            onSavePerson={() => void saveSelectedPerson()}
            onCreateRelationship={() => void createRelationship()}
            onDeletePerson={() => void deletePerson(selectedPerson.id)}
            onOpenConnectedPerson={(personId) => focusPerson(personId, undefined, true)}
            onStartRelationshipEdit={startRelationshipEdit}
            onCancelRelationshipEdit={cancelRelationshipEdit}
            onDeleteRelationship={(relationshipId) => void deleteRelationship(relationshipId)}
          />
        )}

        {!selectedPerson && selectedRelationship && (
          <RelationshipSidebar
            relationship={selectedRelationship}
            sourcePerson={persons.find((person) => person.id === relationshipPanelForm.sourceId) ?? null}
            targetPerson={persons.find((person) => person.id === relationshipPanelForm.targetId) ?? null}
            persons={persons}
            form={relationshipPanelForm}
            saving={savingRelationshipPanel}
            error={relationshipPanelError}
            onClose={() => setSelectedRelationshipId(null)}
            onFormChange={(patch) => setRelationshipPanelForm((current) => ({ ...current, ...patch }))}
            onSave={() => void saveSelectedRelationship()}
            onDelete={() => void deleteRelationship(selectedRelationship.id)}
            onFocusPerson={(personId) => focusPerson(personId)}
            onEditPerson={editPersonFromRelationship}
          />
        )}

        {!selectedPerson && !selectedRelationship && isTreePanelOpen && currentTree && (
          <TreeSidebar
            tree={currentTree}
            treeForm={treeForm}
            personsCount={persons.length}
            relationshipsCount={relationships.length}
            savingTree={savingTree}
            treeError={treeError}
            onClose={() => setIsTreePanelOpen(false)}
            onShareTree={() => shareCurrentTree()}
            onTreeFormChange={(patch) => setTreeForm((current) => ({ ...current, ...patch }))}
            onSaveTree={() => void saveTreeSettings()}
          />
        )}

        {!selectedPerson && !selectedRelationship && !isTreePanelOpen && isPersonListOpen && (
          <PersonListSidebar
            persons={persons}
            selectedPersonId={selectedPersonId}
            onClose={() => setIsPersonListOpen(false)}
            onFocusPerson={(personId) => focusPerson(personId)}
            onEditPerson={(personId) => focusPerson(personId, undefined, true)}
            onDeletePerson={(personId) => void deletePerson(personId)}
          />
        )}

        {isSettingsOpen && (
          <EditorSettingsModal
            settings={viewSettings}
            onClose={() => setIsSettingsOpen(false)}
            onChange={(patch) => setViewSettings((current) => ({ ...current, ...patch }))}
          />
        )}
      </div>

      <div className="editor-corner editor-corner--left">
        <span className="floating-badge">{zoomPercent}%</span>
      </div>

      <div className="editor-corner editor-corner--right">
        <button
          className="floating-badge floating-badge--interactive"
          onClick={() => {
            setSelectedPersonId(null)
            setSelectedRelationshipId(null)
            setIsTreePanelOpen(false)
            setIsPersonListOpen((current) => !current)
          }}
          type="button"
        >
          {persons.length} персон
        </button>
      </div>

      <div className="editor-title">{currentTree?.title ?? 'Дерево'}</div>
    </section>
  )
}
