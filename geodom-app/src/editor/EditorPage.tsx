import { useEffect, useMemo, useState } from 'react'
import { Background, BackgroundVariant, ReactFlow, applyNodeChanges, type NodeChange, type ReactFlowInstance } from '@xyflow/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { CompactPersonNode } from '../components/CompactPersonNode'
import type { TreeEditorPayload, TreeEditorRelationship, TreePerson, TreeSummary } from '../types'
import { ArrowLeftIcon, FitIcon, GearIcon, PlusIcon, SparkIcon, ZoomInIcon, ZoomOutIcon } from '../ui/icons'
import { PersonListSidebar, PersonSidebar, TreeSidebar, type RelationshipRole } from './EditorSidebar'
import { createEditorEdges, createEditorNodes, emptyPersonForm, emptyTreeForm, extractLayout, type PersonFormState, type TreeFormState } from './utils'

const compactNodeTypes = { compactPerson: CompactPersonNode }
const NODE_WIDTH = 144
const NODE_HEIGHT = 48

export function EditorPage({ trees, reloadTrees }: { trees: TreeSummary[]; reloadTrees: () => Promise<void> }) {
  const navigate = useNavigate()
  const { treeId = '' } = useParams()

  const [flow, setFlow] = useState<ReactFlowInstance | null>(null)
  const [zoomPercent, setZoomPercent] = useState(63)
  const [editorStatus, setEditorStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [editorTree, setEditorTree] = useState<TreeSummary | null>(null)
  const [persons, setPersons] = useState<TreePerson[]>([])
  const [relationships, setRelationships] = useState<TreeEditorRelationship[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [isTreePanelOpen, setIsTreePanelOpen] = useState(false)
  const [isPersonListOpen, setIsPersonListOpen] = useState(false)
  const [shouldFitView, setShouldFitView] = useState(true)
  const [creatingPerson, setCreatingPerson] = useState(false)
  const [savingPerson, setSavingPerson] = useState(false)
  const [savingTree, setSavingTree] = useState(false)
  const [linkingRelationship, setLinkingRelationship] = useState(false)
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null)
  const [personError, setPersonError] = useState('')
  const [treeError, setTreeError] = useState('')
  const [relationshipError, setRelationshipError] = useState('')
  const [personForm, setPersonForm] = useState<PersonFormState>(emptyPersonForm)
  const [treeForm, setTreeForm] = useState<TreeFormState>(emptyTreeForm)
  const [relationshipForm, setRelationshipForm] = useState<{ targetId: string; role: RelationshipRole }>({
    targetId: '',
    role: 'child',
  })

  const fallbackTree = trees.find((entry) => entry.id === treeId) ?? null
  const currentTree = editorTree ?? fallbackTree
  const treeIndex = trees.findIndex((entry) => entry.id === treeId)
  const selectedPerson = persons.find((person) => person.id === selectedPersonId) ?? null
  const nodes = useMemo(() => createEditorNodes(persons, selectedPersonId), [persons, selectedPersonId])
  const edges = useMemo(() => createEditorEdges(relationships), [relationships])
  const relationshipTargets = useMemo(() => persons.filter((person) => person.id !== selectedPersonId), [persons, selectedPersonId])
  const selectedConnections = useMemo(() => {
    if (!selectedPersonId) return []

    return relationships
      .filter((item) => item.source === selectedPersonId || item.target === selectedPersonId)
      .map((item) => {
        const otherId = item.source === selectedPersonId ? item.target : item.source
        const role: RelationshipRole = item.kind === 'partner' ? 'partner' : item.source === selectedPersonId ? 'child' : 'parent'

        return {
          id: item.id,
          kind: item.kind,
          label: persons.find((person) => person.id === otherId)?.label ?? 'Неизвестная персона',
          role,
          personId: otherId,
        }
      })
  }, [persons, relationships, selectedPersonId])

  useEffect(() => {
    let cancelled = false

    async function loadEditor() {
      if (!treeId) return

      setEditorStatus('loading')
      setSelectedPersonId(null)
      setEditingRelationshipId(null)
      setIsTreePanelOpen(false)
      setIsPersonListOpen(false)

      try {
        const response = await fetch(`/api/trees/${treeId}/editor`)
        if (!response.ok) throw new Error('Unable to load tree editor')

        const payload = (await response.json()) as TreeEditorPayload
        if (cancelled) return

        setEditorTree(payload.tree)
        setPersons(payload.persons)
        setRelationships(payload.relationships)
        setEditorStatus('ready')
        setShouldFitView(true)
      } catch {
        if (cancelled) return

        setEditorStatus('error')
        setEditorTree(fallbackTree)
        setPersons([])
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
          }
        : emptyPersonForm,
    )
  }, [selectedPerson])

  useEffect(() => {
    setTreeForm(currentTree ? { title: currentTree.title, surname: currentTree.surname, privacy: currentTree.privacy } : emptyTreeForm)
  }, [currentTree])

  useEffect(() => {
    setEditingRelationshipId(null)
    setRelationshipError('')
  }, [selectedPersonId])

  useEffect(() => {
    setRelationshipForm((current) => ({
      role: current.role,
      targetId: relationshipTargets.some((person) => person.id === current.targetId) ? current.targetId : relationshipTargets[0]?.id ?? '',
    }))
  }, [relationshipTargets])

  if (!treeId) return <Navigate to="/trees" replace />

  function syncZoom() {
    if (!flow) return
    setZoomPercent(Math.round(flow.getViewport().zoom * 100))
  }

  function fitViewportToPersons(targetPersons: TreePerson[]) {
    if (!flow || targetPersons.length === 0) return

    const minX = Math.min(...targetPersons.map((person) => person.x))
    const minY = Math.min(...targetPersons.map((person) => person.y))
    const maxX = Math.max(...targetPersons.map((person) => person.x + NODE_WIDTH))
    const maxY = Math.max(...targetPersons.map((person) => person.y + NODE_HEIGHT))

    void flow.fitBounds(
      {
        x: minX - 120,
        y: minY - 120,
        width: Math.max(maxX - minX + 240, 320),
        height: Math.max(maxY - minY + 240, 220),
      },
      { duration: 260, padding: 0.1 },
    )

    window.setTimeout(syncZoom, 320)
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
      x: Math.round(centerPoint.x - NODE_WIDTH / 2),
      y: Math.round(centerPoint.y - NODE_HEIGHT / 2),
    }
  }

  function focusPerson(personId: string, explicitPerson?: TreePerson, openEditor = false) {
    const person = explicitPerson ?? persons.find((item) => item.id === personId)
    if (!person) return

    setIsTreePanelOpen(false)

    if (openEditor) {
      setSelectedPersonId(personId)
      setIsPersonListOpen(false)
    } else {
      setSelectedPersonId(null)
      setIsPersonListOpen(true)
    }

    if (!flow) return

    void flow.setCenter(person.x + NODE_WIDTH / 2, person.y + NODE_HEIGHT / 2, {
      duration: 320,
      zoom: Math.max(flow.getZoom(), 0.95),
    })

    window.setTimeout(syncZoom, 360)
  }

  function updatePersonPositions(changes: NodeChange[]) {
    setPersons((current) => {
      const changedNodes = applyNodeChanges(changes, createEditorNodes(current, selectedPersonId))
      return current.map((person) => {
        const node = changedNodes.find((item) => item.id === person.id)
        return node ? { ...person, x: Math.round(node.position.x), y: Math.round(node.position.y) } : person
      })
    })
  }

  async function persistPersonPosition(personId: string, x: number, y: number) {
    if (!treeId) return

    try {
      await fetch(`/api/trees/${treeId}/persons/${personId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: Math.round(x), y: Math.round(y) }),
      })
      void reloadTrees()
    } catch {}
  }

  async function persistLayout(nextPersons: TreePerson[]) {
    if (!treeId) return

    try {
      await fetch(`/api/trees/${treeId}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persons: extractLayout(nextPersons) }),
      })
      void reloadTrees()
    } catch {}
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
      setSelectedPersonId(created.id)
      setIsTreePanelOpen(false)
      setIsPersonListOpen(false)
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
      setRelationships((current) => current.filter((item) => item.source !== personId && item.target !== personId))

      if (selectedPersonId === personId) {
        setSelectedPersonId(null)
      }

      if (editingRelationshipId) {
        setEditingRelationshipId(null)
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

      setEditorTree((await response.json()) as TreeSummary)
      await reloadTrees()
    } catch {
      setTreeError('Не удалось сохранить метаданные дерева.')
    } finally {
      setSavingTree(false)
    }
  }

  function startRelationshipEdit(relationshipId: string) {
    const connection = selectedConnections.find((item) => item.id === relationshipId)
    if (!connection) return

    setRelationshipForm({
      targetId: connection.personId,
      role: connection.role,
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
    }))
  }

  async function createRelationship() {
    if (!treeId || !selectedPerson || !relationshipForm.targetId || linkingRelationship) return

    setLinkingRelationship(true)
    setRelationshipError('')

    try {
      const payload =
        relationshipForm.role === 'parent'
          ? { sourceId: relationshipForm.targetId, targetId: selectedPerson.id, kind: 'parent-child' as const }
          : relationshipForm.role === 'child'
            ? { sourceId: selectedPerson.id, targetId: relationshipForm.targetId, kind: 'parent-child' as const }
            : { sourceId: selectedPerson.id, targetId: relationshipForm.targetId, kind: 'partner' as const }

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
      if (editingRelationshipId === relationshipId) {
        cancelRelationshipEdit()
      }
      await reloadTrees()
    } catch {
      setRelationshipError('Не удалось удалить связь.')
    }
  }

  function relayout() {
    const columns = Math.max(2, Math.ceil(Math.sqrt(Math.max(persons.length, 1))))
    const nextPersons = persons.map((person, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)

      return {
        ...person,
        x: 300 + column * 190 + (row % 2) * 16,
        y: 240 + row * 150,
      }
    })

    setPersons(nextPersons)
    void persistLayout(nextPersons)
    setShouldFitView(true)
  }

  return (
    <section className="editor-screen">
      <div className="editor-top editor-top--left">
        <button className="floating-button" onClick={() => navigate('/trees')} type="button" aria-label="Назад">
          <ArrowLeftIcon />
        </button>
        <span className="floating-badge">{treeIndex >= 0 ? treeIndex + 1 : 1}</span>
      </div>

      <div className="editor-top editor-top--center">
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
          >
            <SparkIcon />
            <span>Раскладка</span>
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
      </div>

      <div className="editor-top editor-top--right">
        <button
          className="floating-action"
          onClick={() => {
            setSelectedPersonId(null)
            setIsPersonListOpen(false)
            setIsTreePanelOpen((current) => !current)
          }}
          type="button"
        >
          <GearIcon />
          <span>Действия</span>
        </button>
      </div>

      <div className="editor-canvas">
        <ReactFlow
          fitView
          minZoom={0.3}
          maxZoom={1.7}
          nodes={nodes}
          edges={edges}
          nodeTypes={compactNodeTypes}
          onInit={setFlow}
          onMoveEnd={syncZoom}
          onNodeClick={(_, node) => {
            setSelectedPersonId(node.id)
            setIsTreePanelOpen(false)
            setIsPersonListOpen(false)
          }}
          onNodeDragStop={(_, node) => void persistPersonPosition(node.id, node.position.x, node.position.y)}
          onNodesChange={updatePersonPositions}
          onPaneClick={() => {
            setSelectedPersonId(null)
            setIsPersonListOpen(false)
          }}
          nodesDraggable
          panOnDrag
          zoomOnScroll
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

        {selectedPerson && (
          <PersonSidebar
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
            onClose={() => setSelectedPersonId(null)}
            onPersonFormChange={(patch) => setPersonForm((current) => ({ ...current, ...patch }))}
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

        {!selectedPerson && isTreePanelOpen && currentTree && (
          <TreeSidebar
            tree={currentTree}
            treeForm={treeForm}
            personsCount={persons.length}
            relationshipsCount={relationships.length}
            savingTree={savingTree}
            treeError={treeError}
            onClose={() => setIsTreePanelOpen(false)}
            onTreeFormChange={(patch) => setTreeForm((current) => ({ ...current, ...patch }))}
            onSaveTree={() => void saveTreeSettings()}
          />
        )}

        {!selectedPerson && !isTreePanelOpen && isPersonListOpen && (
          <PersonListSidebar
            persons={persons}
            selectedPersonId={selectedPersonId}
            onClose={() => setIsPersonListOpen(false)}
            onFocusPerson={(personId) => focusPerson(personId)}
            onEditPerson={(personId) => focusPerson(personId, undefined, true)}
            onDeletePerson={(personId) => void deletePerson(personId)}
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
