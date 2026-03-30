import { useEffect, useMemo, useState } from 'react'
import { Background, BackgroundVariant, ReactFlow, applyNodeChanges, type NodeChange, type ReactFlowInstance } from '@xyflow/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { CompactPersonNode } from '../components/CompactPersonNode'
import type { RelationshipKind, TreeEditorPayload, TreeEditorRelationship, TreePerson, TreeSummary } from '../types'
import { ArrowLeftIcon, FitIcon, GearIcon, PlusIcon, SparkIcon, ZoomInIcon, ZoomOutIcon } from '../ui/icons'
import { PersonListSidebar, PersonSidebar, TreeSidebar } from './EditorSidebar'
import { createEditorEdges, createEditorNodes, emptyPersonForm, emptyTreeForm, extractLayout, type PersonFormState, type TreeFormState } from './utils'

const compactNodeTypes = { compactPerson: CompactPersonNode }

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
  const [personError, setPersonError] = useState('')
  const [treeError, setTreeError] = useState('')
  const [relationshipError, setRelationshipError] = useState('')
  const [personForm, setPersonForm] = useState<PersonFormState>(emptyPersonForm)
  const [treeForm, setTreeForm] = useState<TreeFormState>(emptyTreeForm)
  const [relationshipForm, setRelationshipForm] = useState<{ targetId: string; kind: RelationshipKind }>({ targetId: '', kind: 'parent-child' })

  const fallbackTree = trees.find((entry) => entry.id === treeId) ?? null
  const currentTree = editorTree ?? fallbackTree
  const treeIndex = trees.findIndex((entry) => entry.id === treeId)
  const selectedPerson = persons.find((person) => person.id === selectedPersonId) ?? null
  const nodes = useMemo(() => createEditorNodes(persons, selectedPersonId), [persons, selectedPersonId])
  const edges = useMemo(() => createEditorEdges(relationships), [relationships])
  const relationshipTargets = useMemo(() => persons.filter((person) => person.id !== selectedPersonId), [persons, selectedPersonId])
  const selectedConnections = useMemo(() => {
    if (!selectedPersonId) return []
    return relationships.filter((item) => item.source === selectedPersonId || item.target === selectedPersonId).map((item) => {
      const otherId = item.source === selectedPersonId ? item.target : item.source
      return { id: item.id, kind: item.kind, label: persons.find((person) => person.id === otherId)?.label ?? 'Неизвестная персона' }
    })
  }, [persons, relationships, selectedPersonId])

  useEffect(() => {
    let cancelled = false
    async function loadEditor() {
      if (!treeId) return
      setEditorStatus('loading')
      setSelectedPersonId(null)
      setIsTreePanelOpen(false)
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
        if (!cancelled) {
          setEditorStatus('error')
          setEditorTree(fallbackTree)
          setPersons([])
          setRelationships([])
        }
      }
    }
    void loadEditor()
    return () => { cancelled = true }
  }, [treeId])

  useEffect(() => { if (flow) setZoomPercent(Math.round(flow.getViewport().zoom * 100)) }, [flow])
  useEffect(() => {
    if (!flow || !shouldFitView || persons.length === 0) return
    void flow.fitView({ duration: 220, padding: 0.35 })
    window.setTimeout(() => { setZoomPercent(Math.round(flow.getViewport().zoom * 100)); setShouldFitView(false) }, 260)
  }, [flow, persons, shouldFitView])
  useEffect(() => { setPersonForm(selectedPerson ? { firstName: selectedPerson.firstName, lastName: selectedPerson.lastName, years: selectedPerson.years, place: selectedPerson.place, branch: selectedPerson.branch, note: selectedPerson.note, accent: selectedPerson.accent } : emptyPersonForm) }, [selectedPerson])
  useEffect(() => { setTreeForm(currentTree ? { title: currentTree.title, surname: currentTree.surname, privacy: currentTree.privacy } : emptyTreeForm) }, [currentTree])
  useEffect(() => { setRelationshipForm((current) => ({ kind: current.kind, targetId: relationshipTargets.some((person) => person.id === current.targetId) ? current.targetId : relationshipTargets[0]?.id ?? '' })) }, [relationshipTargets])

  if (!treeId) return <Navigate to="/trees" replace />

  function syncZoom() {
    if (!flow) return
    setZoomPercent(Math.round(flow.getViewport().zoom * 100))
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
      x: Math.round(centerPoint.x - 72),
      y: Math.round(centerPoint.y - 24),
    }
  }

  function focusPerson(personId: string, explicitPerson?: TreePerson) {
    const person = explicitPerson ?? persons.find((item) => item.id === personId)
    if (!person) return

    setSelectedPersonId(personId)
    setIsTreePanelOpen(false)
    setIsPersonListOpen(false)

    if (!flow) return

    void flow.setCenter(person.x + 72, person.y + 24, {
      duration: 280,
      zoom: Math.max(flow.getZoom(), 0.95),
    })

    window.setTimeout(syncZoom, 320)
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
      await fetch(`/api/trees/${treeId}/persons/${personId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: Math.round(x), y: Math.round(y) }) })
      void reloadTrees()
    } catch {}
  }

  async function persistLayout(nextPersons: TreePerson[]) {
    if (!treeId) return
    try {
      await fetch(`/api/trees/${treeId}/layout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ persons: extractLayout(nextPersons) }) })
      void reloadTrees()
    } catch {}
  }

  async function addCompactPerson() {
    if (!treeId || creatingPerson) return
    setCreatingPerson(true)
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
      window.setTimeout(() => focusPerson(created.id, created), 40)
      setShouldFitView(false)
      await reloadTrees()
    } catch { setEditorStatus('error') } finally { setCreatingPerson(false) }
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

      if (!response.ok) {
        throw new Error('Unable to delete person')
      }

      setPersons((current) => current.filter((item) => item.id !== personId))
      setRelationships((current) => current.filter((item) => item.source !== personId && item.target !== personId))

      if (selectedPersonId === personId) {
        setSelectedPersonId(null)
      }

      await reloadTrees()
    } catch {
      setPersonError('Не удалось удалить персону.')
    }
  }

  async function saveSelectedPerson() {
    if (!treeId || !selectedPerson || savingPerson) return
    setSavingPerson(true); setPersonError('')
    try {
      const response = await fetch(`/api/trees/${treeId}/persons/${selectedPerson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(personForm) })
      if (!response.ok) throw new Error('Unable to save person')
      const updated = (await response.json()) as TreePerson
      setPersons((current) => current.map((person) => person.id === updated.id ? updated : person))
      await reloadTrees()
    } catch { setPersonError('Не удалось сохранить изменения персоны.') } finally { setSavingPerson(false) }
  }

  async function saveTreeSettings() {
    if (!treeId || savingTree) return
    setSavingTree(true); setTreeError('')
    try {
      const response = await fetch(`/api/trees/${treeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(treeForm) })
      if (!response.ok) throw new Error('Unable to save tree')
      setEditorTree((await response.json()) as TreeSummary)
      await reloadTrees()
    } catch { setTreeError('Не удалось сохранить метаданные дерева.') } finally { setSavingTree(false) }
  }

  async function createRelationship() {
    if (!treeId || !selectedPerson || !relationshipForm.targetId || linkingRelationship) return
    setLinkingRelationship(true); setRelationshipError('')
    try {
      const response = await fetch(`/api/trees/${treeId}/relationships`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId: selectedPerson.id, targetId: relationshipForm.targetId, kind: relationshipForm.kind }) })
      if (!response.ok) throw new Error('Unable to create relationship')
      const created = (await response.json()) as TreeEditorRelationship
      setRelationships((current) => [...current, created])
      await reloadTrees()
    } catch { setRelationshipError('Связь уже существует или не может быть создана.') } finally { setLinkingRelationship(false) }
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
      <div className="editor-top editor-top--left"><button className="floating-button" onClick={() => navigate('/trees')} type="button" aria-label="Назад"><ArrowLeftIcon /></button><span className="floating-badge">{treeIndex >= 0 ? treeIndex + 1 : 1}</span></div>
      <div className="editor-top editor-top--center"><div className="floating-toolbar"><button onClick={(event) => { event.stopPropagation(); void addCompactPerson() }} type="button"><PlusIcon /><span>{creatingPerson ? 'Создаём...' : 'Персона'}</span></button><div className="floating-toolbar__divider" /><button onClick={(event) => { event.stopPropagation(); relayout() }} type="button"><SparkIcon /><span>Раскладка</span></button><div className="floating-toolbar__divider" /><button onClick={() => { if (flow) { void flow.zoomIn({ duration: 180 }); window.setTimeout(syncZoom, 220) } }} type="button" aria-label="Увеличить"><ZoomInIcon /></button><button onClick={() => { if (flow) { void flow.zoomOut({ duration: 180 }); window.setTimeout(syncZoom, 220) } }} type="button" aria-label="Уменьшить"><ZoomOutIcon /></button><button onClick={() => { if (flow) { void flow.fitView({ duration: 220, padding: 0.35 }); window.setTimeout(syncZoom, 260) } }} type="button" aria-label="Вписать"><FitIcon /></button></div></div>
      <div className="editor-top editor-top--right"><button className="floating-action" onClick={() => { setSelectedPersonId(null); setIsTreePanelOpen((current) => !current) }} type="button"><GearIcon /><span>Действия</span></button></div>

      <div className="editor-canvas">
        <ReactFlow fitView minZoom={0.3} maxZoom={1.7} nodes={nodes} edges={edges} nodeTypes={compactNodeTypes} onInit={setFlow} onMoveEnd={syncZoom} onNodeClick={(_, node) => { setSelectedPersonId(node.id); setIsTreePanelOpen(false); setIsPersonListOpen(false) }} onNodeDragStop={(_, node) => void persistPersonPosition(node.id, node.position.x, node.position.y)} onNodesChange={updatePersonPositions} onPaneClick={() => { setSelectedPersonId(null); setIsPersonListOpen(false) }} nodesDraggable panOnDrag zoomOnScroll proOptions={{ hideAttribution: true }}>
          <Background color="#e0cdbb" gap={18} size={1.2} variant={BackgroundVariant.Dots} />
        </ReactFlow>

        {editorStatus !== 'ready' && <div className="editor-status-card"><strong>{editorStatus === 'loading' ? 'Загружаем дерево' : 'Не удалось открыть дерево'}</strong><span>{editorStatus === 'loading' ? 'Подтягиваем персон и связи из базы проекта.' : 'Проверьте backend или обновите страницу.'}</span></div>}
        {selectedPerson && <PersonSidebar selectedPerson={selectedPerson} personForm={personForm} savingPerson={savingPerson} personError={personError} relationshipError={relationshipError} linkingRelationship={linkingRelationship} relationshipTargets={relationshipTargets} relationshipForm={relationshipForm} selectedConnections={selectedConnections} onClose={() => setSelectedPersonId(null)} onPersonFormChange={(patch) => setPersonForm((current) => ({ ...current, ...patch }))} onRelationshipFormChange={(patch) => setRelationshipForm((current) => ({ ...current, ...patch }))} onSavePerson={() => void saveSelectedPerson()} onCreateRelationship={() => void createRelationship()} onDeletePerson={() => void deletePerson(selectedPerson.id)} />}
        {!selectedPerson && isTreePanelOpen && currentTree && <TreeSidebar tree={currentTree} treeForm={treeForm} personsCount={persons.length} relationshipsCount={relationships.length} savingTree={savingTree} treeError={treeError} onClose={() => setIsTreePanelOpen(false)} onTreeFormChange={(patch) => setTreeForm((current) => ({ ...current, ...patch }))} onSaveTree={() => void saveTreeSettings()} />}
        {!selectedPerson && !isTreePanelOpen && isPersonListOpen && <PersonListSidebar persons={persons} selectedPersonId={selectedPersonId} onClose={() => setIsPersonListOpen(false)} onOpenPerson={focusPerson} onDeletePerson={(personId) => void deletePerson(personId)} />}
      </div>

      <div className="editor-corner editor-corner--left"><span className="floating-badge">{zoomPercent}%</span></div>
      <div className="editor-corner editor-corner--right"><button className="floating-badge floating-badge--interactive" onClick={() => { setSelectedPersonId(null); setIsTreePanelOpen(false); setIsPersonListOpen((current) => !current) }} type="button">{persons.length} персон</button></div>
      <div className="editor-title">{currentTree?.title ?? 'Дерево'}</div>
    </section>
  )
}
