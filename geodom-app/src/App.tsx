import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
} from '@xyflow/react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'

import { initialTrees } from './data'
import { CompactPersonNode } from './components/CompactPersonNode'
import { OldApp } from './OldApp'
import type { TreeSummary } from './types'

type ApiStatus = 'loading' | 'ready' | 'error'

type TreeStore = {
  trees: TreeSummary[]
  apiStatus: ApiStatus
  createTree: (input?: Partial<Pick<TreeSummary, 'title' | 'surname' | 'privacy'>>) => Promise<TreeSummary | null>
}

const compactNodeTypes = {
  compactPerson: CompactPersonNode,
}

function createEditorNodes(): Node[] {
  return [
    {
      id: 'left',
      type: 'compactPerson',
      position: { x: 390, y: 430 },
      data: { label: 'Иван Ладыженко', accent: 'blue' },
    },
    {
      id: 'top',
      type: 'compactPerson',
      position: { x: 528, y: 430 },
      data: { label: '2 2', accent: 'blue' },
    },
    {
      id: 'right',
      type: 'compactPerson',
      position: { x: 720, y: 430 },
      data: { label: '3 3', accent: 'slate' },
    },
    {
      id: 'bottom',
      type: 'compactPerson',
      position: { x: 560, y: 590 },
      data: { label: '2 2', accent: 'pink' },
    },
  ]
}

function createEditorEdges(): Edge[] {
  return [
    {
      id: 'vertical',
      source: 'top',
      target: 'bottom',
      type: 'smoothstep',
      style: { stroke: '#d9d3cd', strokeWidth: 1.4 },
    },
    {
      id: 'angled',
      source: 'right',
      target: 'bottom',
      type: 'smoothstep',
      style: { stroke: '#d9d3cd', strokeWidth: 1.4 },
    },
  ]
}

function useTreeStore(): TreeStore {
  const [trees, setTrees] = useState(initialTrees)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function loadTrees() {
      try {
        const response = await fetch('/api/trees')
        if (!response.ok) {
          throw new Error('Unable to load trees')
        }

        const payload = (await response.json()) as TreeSummary[]
        if (!cancelled) {
          setTrees(payload.length > 0 ? payload : initialTrees)
          setApiStatus('ready')
        }
      } catch {
        if (!cancelled) {
          setApiStatus('error')
        }
      }
    }

    void loadTrees()

    return () => {
      cancelled = true
    }
  }, [])

  async function createTree(input?: Partial<Pick<TreeSummary, 'title' | 'surname' | 'privacy'>>) {
    try {
      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: input?.title ?? `Новое дерево ${trees.length + 1}`,
          surname: input?.surname ?? 'Новая семья',
          privacy: input?.privacy ?? 'private',
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to create tree')
      }

      const created = (await response.json()) as TreeSummary
      setTrees((current) => [created, ...current])
      setApiStatus('ready')
      return created
    } catch {
      setApiStatus('error')
      return null
    }
  }

  return { trees, apiStatus, createTree }
}

function TreeLogo() {
  return (
    <span className="geodom-brand__icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.2 6.5 10h2.7l-3 4h2.3l-2.1 3.2h4.6V20a1 1 0 0 0 2 0v-2.8h4.6L15.5 14h2.3l-3-4h2.7Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    </span>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h5v5H5zm9 0h5v5h-5zM5 14h5v5H5zm9 0h5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12h16M12 4c2.4 2.5 3.4 5.2 3.4 8s-1 5.5-3.4 8M12 4C9.6 6.5 8.6 9.2 8.6 12s1 5.5 3.4 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.4a3.6 3.6 0 1 0-3.6-3.6 3.6 3.6 0 0 0 3.6 3.6Zm0 1.8c-3 0-5.7 1.55-5.7 3.5a.8.8 0 0 0 1.6 0c0-.94 1.86-2.1 4.1-2.1s4.1 1.16 4.1 2.1a.8.8 0 0 0 1.6 0c0-1.95-2.7-3.5-5.7-3.5Z" fill="currentColor" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12h.01M12 12h.01M18 12h.01" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5M9 12h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 4 1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7ZM18 4l.6 1.4L20 6l-1.4.6L18 8l-.6-1.4L16 6l1.4-.6ZM18 16l.6 1.4L20 18l-1.4.6L18 20l-.6-1.4L16 18l1.4-.6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 8v6M8 11h6m2 5 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11h6m2 5 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function FitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4H4v4M16 4h4v4M20 16v4h-4M8 20H4v-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8.8A3.2 3.2 0 1 0 15.2 12 3.2 3.2 0 0 0 12 8.8Zm8 3.2-1.75-.7a6.8 6.8 0 0 0-.6-1.45l.8-1.7-1.8-1.8-1.7.8a6.8 6.8 0 0 0-1.45-.6L12 4l-1.4 1.75a6.8 6.8 0 0 0-1.45.6l-1.7-.8-1.8 1.8.8 1.7a6.8 6.8 0 0 0-.6 1.45L4 12l1.75 1.4a6.8 6.8 0 0 0 .6 1.45l-.8 1.7 1.8 1.8 1.7-.8a6.8 6.8 0 0 0 1.45.6L12 20l1.4-1.75a6.8 6.8 0 0 0 1.45-.6l1.7.8 1.8-1.8-.8-1.7a6.8 6.8 0 0 0 .6-1.45Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  )
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 7.5 18.5 12 14 16.5M8 12h10.5M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11.5a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 9 11.5Zm6 0a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5ZM9 13c-2.2 0-4 .96-4 2.4a.7.7 0 0 0 1.4 0c0-.52 1.15-1.1 2.6-1.1s2.6.58 2.6 1.1a.7.7 0 0 0 1.4 0C13 13.96 11.2 13 9 13Zm6 0c-.81 0-1.57.13-2.22.37a4 4 0 0 1 1.22 2.03c.32-.08.66-.13 1-.13 1.45 0 2.6.58 2.6 1.1a.7.7 0 0 0 1.4 0C19 13.96 17.2 13 15 13Z" fill="currentColor" />
    </svg>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="geodom-page">
      <header className="geodom-header">
        <Link className="geodom-brand" to="/trees">
          <TreeLogo />
          <span>Geodom</span>
        </Link>

        <nav className="geodom-nav">
          <NavLink className={({ isActive }) => `geodom-nav__link${isActive ? ' is-active' : ''}`} to="/trees">
            <GridIcon />
            <span>Мои деревья</span>
          </NavLink>
          <NavLink className={({ isActive }) => `geodom-nav__link${isActive ? ' is-active' : ''}`} to="/catalog">
            <GlobeIcon />
            <span>Каталог</span>
          </NavLink>
        </nav>

        <div className="geodom-user">
          <span className="geodom-user__avatar">
            <UserIcon />
          </span>
          <span className="geodom-user__name">Родион</span>
          <span className="geodom-user__logout" aria-hidden="true">
            <ExitIcon />
          </span>
        </div>
      </header>

      <main className={`geodom-content${location.pathname === '/catalog' ? ' is-catalog' : ''}`}>{children}</main>
    </div>
  )
}

function TreeCard({ tree, href }: { tree: TreeSummary; href: string }) {
  const privacyLabel =
    tree.privacy === 'public' ? 'Публичное' : tree.privacy === 'shared' ? 'Совместное' : 'Приватное'

  return (
    <Link className="tree-preview-card" to={href}>
      <div className="tree-preview-card__icon">
        <TreeLogo />
      </div>
      <button
        className="tree-preview-card__more"
        type="button"
        aria-label="Меню дерева"
        onClick={(event) => event.preventDefault()}
      >
        <MoreIcon />
      </button>
      <div className="tree-preview-card__body">
        <strong>{tree.title}</strong>
        <span>{tree.surname}</span>
      </div>
      <div className="tree-preview-card__meta">
        <span className="tree-preview-card__meta-item">
          <PeopleIcon />
          <span>{tree.members} чел.</span>
        </span>
        <span className="tree-preview-card__meta-item">
          <GlobeIcon />
          <span>{privacyLabel}</span>
        </span>
      </div>
    </Link>
  )
}

function TreesPage({ trees, createTree }: TreeStore) {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    const created = await createTree({
      title: `Новое дерево ${trees.length + 1}`,
      surname: 'Новая семья',
      privacy: 'public',
    })
    setCreating(false)

    if (created) {
      navigate(`/trees/${created.id}`)
    }
  }

  return (
    <PageShell>
      <section className="listing-hero">
        <div>
          <h1>Мои деревья</h1>
          <p>Создавайте и исследуйте свою родословную</p>
        </div>
        <button className="primary-action" disabled={creating} onClick={() => void handleCreate()} type="button">
          <PlusIcon />
          <span>{creating ? 'Создаем...' : 'Новое дерево'}</span>
        </button>
      </section>

      <section className="tree-grid">
        {trees.map((tree) => (
          <TreeCard key={tree.id} tree={tree} href={`/trees/${tree.id}`} />
        ))}
      </section>
    </PageShell>
  )
}

function CatalogPage({ trees }: Pick<TreeStore, 'trees'>) {
  const [query, setQuery] = useState('')

  const filteredTrees = useMemo(() => {
    return trees
      .filter((tree) => tree.privacy === 'public')
      .filter((tree) => `${tree.title} ${tree.surname}`.toLowerCase().includes(query.trim().toLowerCase()))
  }, [query, trees])

  return (
    <PageShell>
      <section className="listing-hero listing-hero--compact">
        <div>
          <h1>Каталог деревьев</h1>
          <p>Публичные генеалогические деревья сообщества</p>
        </div>
      </section>

      <label className="catalog-search">
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию..."
        />
      </label>

      <section className="tree-grid">
        {filteredTrees.map((tree) => (
          <TreeCard key={tree.id} tree={tree} href={`/trees/${tree.id}`} />
        ))}
      </section>
    </PageShell>
  )
}

function EditorPage({ trees }: Pick<TreeStore, 'trees'>) {
  const navigate = useNavigate()
  const { treeId = '' } = useParams()
  const [nodes, setNodes] = useState<Node[]>(() => createEditorNodes())
  const [edges] = useState<Edge[]>(() => createEditorEdges())
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null)
  const [zoomPercent, setZoomPercent] = useState(63)

  const tree = trees.find((entry) => entry.id === treeId) ?? trees[0] ?? null

  useEffect(() => {
    if (!flow) return
    setZoomPercent(Math.round(flow.getViewport().zoom * 100))
  }, [flow])

  if (!tree) {
    return <Navigate to="/trees" replace />
  }

  function syncZoom() {
    if (!flow) return
    setZoomPercent(Math.round(flow.getViewport().zoom * 100))
  }

  function zoomIn() {
    if (!flow) return
    void flow.zoomIn({ duration: 180 })
    window.setTimeout(syncZoom, 220)
  }

  function zoomOut() {
    if (!flow) return
    void flow.zoomOut({ duration: 180 })
    window.setTimeout(syncZoom, 220)
  }

  function fitCanvas() {
    if (!flow) return
    void flow.fitView({ duration: 220, padding: 0.35 })
    window.setTimeout(syncZoom, 260)
  }

  function relayout() {
    setNodes((current) =>
      current.map((node, index) => ({
        ...node,
        position: {
          x: 390 + (index % 3) * 165 - (index === 3 ? 30 : 0),
          y: 430 + Math.floor(index / 3) * 160,
        },
      })),
    )
  }

  function addCompactPerson() {
    const accents: Array<'blue' | 'pink' | 'slate'> = ['blue', 'pink', 'slate']
    const nextIndex = nodes.length + 1

    setNodes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: 'compactPerson',
        position: { x: 420 + (nextIndex % 2) * 180, y: 280 + Math.floor(nextIndex / 2) * 115 },
        data: {
          label: `${nextIndex} ${nextIndex}`,
          accent: accents[nextIndex % accents.length],
        },
      },
    ])
  }

  return (
    <section className="editor-screen">
      <div className="editor-top editor-top--left">
        <button className="floating-button" onClick={() => navigate('/trees')} type="button" aria-label="Назад">
          <ArrowLeftIcon />
        </button>
        <span className="floating-badge">1</span>
      </div>

      <div className="editor-top editor-top--center">
        <div className="floating-toolbar">
          <button onClick={addCompactPerson} type="button">
            <PlusIcon />
            <span>Персона</span>
          </button>
          <div className="floating-toolbar__divider" />
          <button onClick={relayout} type="button">
            <SparkIcon />
            <span>Раскладка</span>
          </button>
          <div className="floating-toolbar__divider" />
          <button onClick={zoomIn} type="button" aria-label="Увеличить">
            <ZoomInIcon />
          </button>
          <button onClick={zoomOut} type="button" aria-label="Уменьшить">
            <ZoomOutIcon />
          </button>
          <button onClick={fitCanvas} type="button" aria-label="Вписать">
            <FitIcon />
          </button>
        </div>
      </div>

      <div className="editor-top editor-top--right">
        <button className="floating-action" type="button">
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
          onMoveEnd={() => syncZoom()}
          onNodesChange={(changes: NodeChange[]) => setNodes((current) => applyNodeChanges(changes, current))}
          nodesDraggable
          panOnDrag
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e0cdbb" gap={18} size={1.2} variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </div>

      <div className="editor-corner editor-corner--left">
        <span className="floating-badge">{zoomPercent}%</span>
      </div>

      <div className="editor-corner editor-corner--right">
        <span className="floating-badge">{nodes.length} персон</span>
      </div>

      <div className="editor-title">{tree.title}</div>
    </section>
  )
}

function NewApp() {
  const store = useTreeStore()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/trees" replace />} />
      <Route path="/trees" element={<TreesPage trees={store.trees} apiStatus={store.apiStatus} createTree={store.createTree} />} />
      <Route path="/catalog" element={<CatalogPage trees={store.trees} />} />
      <Route path="/trees/:treeId" element={<EditorPage trees={store.trees} />} />
      <Route path="/old" element={<OldApp />} />
      <Route path="*" element={<Navigate to="/trees" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <NewApp />
    </BrowserRouter>
  )
}
