import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'

import { initialPersons, initialRelationships, initialTrees } from './data'
import { PersonNode } from './components/PersonNode'
import type { Person, Relationship, TreeSummary } from './types'

const nodeTypes = {
  person: PersonNode,
}

function createNode(person: Person, selectedId: string | null): Node<Person & { selected?: boolean }> {
  return {
    id: person.id,
    type: 'person',
    position: { x: person.x, y: person.y },
    data: { ...person, selected: person.id === selectedId },
    draggable: true,
  }
}

function createEdges(relationships: Relationship[]): Edge[] {
  return relationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.source,
    target: relationship.target,
    type: 'smoothstep',
    animated: relationship.kind === 'partner',
    label: relationship.kind === 'partner' ? 'партнерство' : undefined,
    markerEnd: relationship.kind === 'partner' ? undefined : { type: MarkerType.ArrowClosed },
    style:
      relationship.kind === 'partner'
        ? { stroke: '#c49a8b', strokeWidth: 1.4 }
        : { stroke: '#d8b8a7', strokeWidth: 1.6 },
    labelStyle: { fill: '#7c6257', fontSize: 11 },
  }))
}

function autoLayout(persons: Person[]): Person[] {
  const grouped = new Map<number, Person[]>()

  persons.forEach((person) => {
    const bucket = grouped.get(person.generation) ?? []
    bucket.push(person)
    grouped.set(person.generation, bucket)
  })

  return persons.map((person) => {
    const generation = grouped.get(person.generation) ?? []
    const index = generation.findIndex((entry) => entry.id === person.id)
    const totalWidth = Math.max(generation.length - 1, 0) * 240

    return {
      ...person,
      x: 280 + index * 240 - totalWidth / 2 + person.generation * 40,
      y: 90 + person.generation * 190,
    }
  })
}

function getPrivacyLabel(mode: TreeSummary['privacy']) {
  if (mode === 'private') return 'Приватное'
  if (mode === 'shared') return 'Совместное'
  return 'Публичное'
}

export function OldApp() {
  const [trees, setTrees] = useState(initialTrees)
  const [activeTree, setActiveTree] = useState(initialTrees[0]?.id ?? '')
  const [persons, setPersons] = useState(initialPersons)
  const [relationships, setRelationships] = useState(initialRelationships)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(initialPersons[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [treeTitle, setTreeTitle] = useState('')
  const [treeSurname, setTreeSurname] = useState('')
  const [isCreatingTree, setIsCreatingTree] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadRemoteState() {
      try {
        const [healthResponse, treesResponse] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/trees'),
        ])

        if (!healthResponse.ok || !treesResponse.ok) {
          throw new Error('Remote API is unavailable')
        }

        const remoteTrees = (await treesResponse.json()) as TreeSummary[]
        if (isCancelled) return

        setApiStatus('ready')

        if (remoteTrees.length > 0) {
          setTrees(remoteTrees)
          setActiveTree((current) => {
            const hasCurrent = remoteTrees.some((tree) => tree.id === current)
            return hasCurrent ? current : remoteTrees[0].id
          })
        }
      } catch {
        if (!isCancelled) {
          setApiStatus('error')
        }
      }
    }

    void loadRemoteState()

    return () => {
      isCancelled = true
    }
  }, [])

  const selectedPerson = persons.find((person) => person.id === selectedPersonId) ?? null

  const filteredTrees = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return trees

    return trees.filter((tree) => `${tree.title} ${tree.surname}`.toLowerCase().includes(query))
  }, [search, trees])

  const nodes = useMemo(
    () => persons.map((person) => createNode(person, selectedPersonId)),
    [persons, selectedPersonId],
  )
  const edges = useMemo(() => createEdges(relationships), [relationships])

  const stats = useMemo(() => {
    const generations = new Set(persons.map((person) => person.generation)).size
    const branches = new Set(persons.map((person) => person.branch)).size
    const publicPeople = persons.filter((person) => person.years.includes('н.в.')).length

    return { generations, branches, publicPeople }
  }, [persons])

  function onNodesChange(changes: NodeChange[]) {
    setPersons((current) => {
      const nodesForApply = current.map((person) => createNode(person, selectedPersonId))
      const changedNodes = applyNodeChanges(changes, nodesForApply)

      return current.map((person) => {
        const nextNode = changedNodes.find((node) => node.id === person.id)
        if (!nextNode) return person

        return {
          ...person,
          x: nextNode.position.x,
          y: nextNode.position.y,
        }
      })
    })
  }

  function onEdgesChange(changes: EdgeChange[]) {
    setRelationships((current) => {
      const currentEdges = createEdges(current)
      const changedEdges = applyEdgeChanges(changes, currentEdges)
      return current.filter((relationship) => changedEdges.some((edge) => edge.id === relationship.id))
    })
  }

  function onConnect(connection: Connection) {
    if (!connection.source || !connection.target) return

    setRelationships((current) => {
      const nextId = `r${crypto.randomUUID()}`
      return addEdge(
        {
          id: nextId,
          source: connection.source,
          target: connection.target,
          data: { kind: 'parent-child' },
        },
        createEdges(current),
      ).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        kind: edge.label === 'партнерство' ? 'partner' : 'parent-child',
      }))
    })
  }

  function updateSelectedPerson(patch: Partial<Person>) {
    if (!selectedPersonId) return

    setPersons((current) =>
      current.map((person) => (person.id === selectedPersonId ? { ...person, ...patch } : person)),
    )
  }

  function addPerson(kind: 'child' | 'partner') {
    if (!selectedPerson) return

    const id = crypto.randomUUID()
    const baseName = kind === 'child' ? 'Новый' : 'Партнер'
    const nextPerson: Person = {
      id,
      firstName: baseName,
      lastName: selectedPerson.lastName,
      years: kind === 'child' ? '2000-н.в.' : '1970-н.в.',
      place: selectedPerson.place,
      note: kind === 'child' ? 'Добавлен из правой панели.' : 'Добавлен как партнер выбранной персоны.',
      branch: selectedPerson.branch,
      generation: kind === 'child' ? selectedPerson.generation + 1 : selectedPerson.generation,
      x: selectedPerson.x + (kind === 'child' ? 60 : 260),
      y: selectedPerson.y + (kind === 'child' ? 180 : 0),
    }

    setPersons((current) => [...current, nextPerson])
    setRelationships((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        source: selectedPerson.id,
        target: id,
        kind: kind === 'child' ? 'parent-child' : 'partner',
      },
    ])
    setSelectedPersonId(id)
  }

  async function createTree() {
    if (!treeTitle.trim() || !treeSurname.trim()) return

    setIsCreatingTree(true)

    try {
      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: treeTitle.trim(),
          surname: treeSurname.trim(),
          privacy: 'private',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create tree')
      }

      const created = (await response.json()) as TreeSummary
      setTrees((current) => [created, ...current])
      setActiveTree(created.id)
      setTreeTitle('')
      setTreeSurname('')
      setApiStatus('ready')
    } catch {
      setApiStatus('error')
    } finally {
      setIsCreatingTree(false)
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-card__top">
            <span className="eyebrow">Geodom</span>
            <span className={`status-pill status-pill--${apiStatus}`}>
              {apiStatus === 'loading' && 'API подключается'}
              {apiStatus === 'ready' && 'API и база подключены'}
              {apiStatus === 'error' && 'API недоступен'}
            </span>
          </div>
          <h1>Визуальная мастерская семейного дерева</h1>
          <p>
            Легкий интерфейс для сборки, просмотра и публикации семейного дерева без ощущения
            тяжелой архивной системы.
          </p>
        </div>

        <div className="helper-card helper-card--tight">
          <strong>Быстро создать дерево</strong>
          <div className="quick-form">
            <input
              value={treeTitle}
              onChange={(event) => setTreeTitle(event.target.value)}
              placeholder="Название дерева"
            />
            <input
              value={treeSurname}
              onChange={(event) => setTreeSurname(event.target.value)}
              placeholder="Основная фамилия"
            />
            <button disabled={isCreatingTree} onClick={() => void createTree()} type="button">
              {isCreatingTree ? 'Сохраняем...' : 'Создать в PostgreSQL'}
            </button>
          </div>
        </div>

        <label className="search-field">
          <span>Поиск по деревьям</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Например, Ладыженко"
          />
        </label>

        <div className="tree-list">
          {filteredTrees.map((tree) => (
            <button
              key={tree.id}
              className={`tree-card${tree.id === activeTree ? ' is-active' : ''}`}
              onClick={() => setActiveTree(tree.id)}
              type="button"
            >
              <div className="tree-card__top">
                <strong>{tree.title}</strong>
                <span>{getPrivacyLabel(tree.privacy)}</span>
              </div>
              <p>{tree.members} персон · обновлено {tree.lastUpdated}</p>
            </button>
          ))}
        </div>

        <div className="stat-grid">
          <article>
            <strong>{persons.length}</strong>
            <span>персон в активном дереве</span>
          </article>
          <article>
            <strong>{stats.generations}</strong>
            <span>поколения</span>
          </article>
          <article>
            <strong>{stats.branches}</strong>
            <span>ветки</span>
          </article>
          <article>
            <strong>{stats.publicPeople}</strong>
            <span>живые персоны</span>
          </article>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">MVP editor</span>
            <h2>Редактор дерева</h2>
          </div>

          <div className="toolbar">
            <button onClick={() => setPersons((current) => autoLayout(current))} type="button">
              Автораскладка
            </button>
            <button onClick={() => addPerson('child')} type="button">
              Добавить ребенка
            </button>
            <button onClick={() => addPerson('partner')} type="button">
              Добавить партнера
            </button>
          </div>
        </header>

        <section className="canvas-panel">
          <div className="canvas-shell">
            <div className="canvas-overlay">
              <div>
                <strong>Пастельный режим интерфейса</strong>
                <span>Мягкие теплые фоны, спокойные линии и минимум отвлекающих акцентов.</span>
              </div>
              <div>
                <strong>Что уже работает</strong>
                <span>Drag, zoom, pan, выбор персоны, быстрые добавления и авторасстановка.</span>
              </div>
              <div>
                <strong>Backend уже подключен</strong>
                <span>Список деревьев приходит из Fastify API и хранится в PostgreSQL.</span>
              </div>
            </div>

            <ReactFlow
              fitView
              minZoom={0.3}
              maxZoom={1.4}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedPersonId(node.id)}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#ead7cb" gap={26} size={1.1} variant={BackgroundVariant.Dots} />
              <MiniMap
                pannable
                zoomable
                maskColor="rgba(252, 248, 244, 0.72)"
                nodeColor="#d7b6a4"
                style={{ backgroundColor: '#fbf7f2', borderRadius: 18 }}
              />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>

          <aside className="detail-panel">
            <div className="detail-panel__header">
              <span className="eyebrow">Карточка персоны</span>
              <h3>{selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : 'Ничего не выбрано'}</h3>
            </div>

            {selectedPerson ? (
              <>
                <label className="field">
                  <span>Имя</span>
                  <input
                    value={selectedPerson.firstName}
                    onChange={(event) => updateSelectedPerson({ firstName: event.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Фамилия</span>
                  <input
                    value={selectedPerson.lastName}
                    onChange={(event) => updateSelectedPerson({ lastName: event.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Годы жизни</span>
                  <input
                    value={selectedPerson.years}
                    onChange={(event) => updateSelectedPerson({ years: event.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Место</span>
                  <input
                    value={selectedPerson.place}
                    onChange={(event) => updateSelectedPerson({ place: event.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Ветка</span>
                  <input
                    value={selectedPerson.branch}
                    onChange={(event) => updateSelectedPerson({ branch: event.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Заметка</span>
                  <textarea
                    rows={5}
                    value={selectedPerson.note}
                    onChange={(event) => updateSelectedPerson({ note: event.target.value })}
                  />
                </label>

                <div className="detail-actions">
                  <button onClick={() => addPerson('child')} type="button">
                    Быстро добавить ребенка
                  </button>
                  <button onClick={() => addPerson('partner')} type="button">
                    Добавить партнера
                  </button>
                </div>

                <div className="helper-card">
                  <strong>Следующий шаг для MVP</strong>
                  <p>Теперь можно добавлять auth, GEDCOM import/export и сохранение структуры редактора.</p>
                </div>
              </>
            ) : (
              <p className="empty-state">Выберите карточку на холсте, чтобы отредактировать данные.</p>
            )}
          </aside>
        </section>
      </main>
    </div>
  )
}
