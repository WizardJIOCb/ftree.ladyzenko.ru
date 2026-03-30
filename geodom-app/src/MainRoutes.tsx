import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { initialTrees } from './data'
import { EditorPage } from './editor/EditorPage'
import { OldApp } from './OldApp'
import type { TreeSummary } from './types'
import { ExitIcon, GlobeIcon, GridIcon, MoreIcon, PeopleIcon, PlusIcon, SearchIcon, TreeLogo, UserIcon } from './ui/icons'

type ApiStatus = 'loading' | 'ready' | 'error'

type TreeStore = {
  trees: TreeSummary[]
  apiStatus: ApiStatus
  createTree: (input?: Partial<Pick<TreeSummary, 'title' | 'surname' | 'privacy'>>) => Promise<TreeSummary | null>
  reloadTrees: () => Promise<void>
}

function getPrivacyLabel(mode: TreeSummary['privacy']) {
  if (mode === 'private') return 'Приватное'
  if (mode === 'shared') return 'Совместное'
  return 'Публичное'
}

function useTreeStore(): TreeStore {
  const [trees, setTrees] = useState(initialTrees)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')

  async function reloadTrees() {
    try {
      const response = await fetch('/api/trees')
      if (!response.ok) throw new Error('Unable to load trees')
      const payload = (await response.json()) as TreeSummary[]
      setTrees(payload.length > 0 ? payload : initialTrees)
      setApiStatus('ready')
    } catch {
      setApiStatus('error')
    }
  }

  useEffect(() => {
    void reloadTrees()
  }, [])

  async function createTree(input?: Partial<Pick<TreeSummary, 'title' | 'surname' | 'privacy'>>) {
    try {
      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input?.title ?? `Новое дерево ${trees.length + 1}`,
          surname: input?.surname ?? 'Новая семья',
          privacy: input?.privacy ?? 'private',
        }),
      })

      if (!response.ok) throw new Error('Unable to create tree')
      const created = (await response.json()) as TreeSummary
      setTrees((current) => [created, ...current])
      setApiStatus('ready')
      return created
    } catch {
      setApiStatus('error')
      return null
    }
  }

  return { trees, apiStatus, createTree, reloadTrees }
}

function PageShell({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="geodom-page">
      <header className="geodom-header">
        <Link className="geodom-brand" to="/trees">
          <TreeLogo />
          <span>FTree</span>
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
          <span className="geodom-user__avatar"><UserIcon /></span>
          <span className="geodom-user__name">Родион</span>
          <span className="geodom-user__logout" aria-hidden="true"><ExitIcon /></span>
        </div>
      </header>

      <main className={`geodom-content${location.pathname === '/catalog' ? ' is-catalog' : ''}`}>{children}</main>
    </div>
  )
}

function TreeCard({ tree, href }: { tree: TreeSummary; href: string }) {
  return (
    <Link className="tree-preview-card" to={href}>
      <div className="tree-preview-card__icon"><TreeLogo /></div>
      <button className="tree-preview-card__more" type="button" aria-label="Меню дерева" onClick={(event) => event.preventDefault()}>
        <MoreIcon />
      </button>
      <div className="tree-preview-card__body">
        <strong>{tree.title}</strong>
        <span>{tree.surname}</span>
      </div>
      <div className="tree-preview-card__meta">
        <span className="tree-preview-card__meta-item"><PeopleIcon /><span>{tree.members} чел.</span></span>
        <span className="tree-preview-card__meta-item"><GlobeIcon /><span>{getPrivacyLabel(tree.privacy)}</span></span>
      </div>
    </Link>
  )
}

function TreesPage({ trees, createTree }: TreeStore) {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    const created = await createTree({ title: `Новое дерево ${trees.length + 1}`, surname: 'Новая семья', privacy: 'public' })
    setCreating(false)
    if (created) navigate(`/trees/${created.id}`)
  }

  return (
    <PageShell>
      <section className="listing-hero">
        <div><h1>Мои деревья</h1><p>Создавайте и исследуйте свою родословную</p></div>
        <button className="primary-action" disabled={creating} onClick={() => void handleCreate()} type="button">
          <PlusIcon />
          <span>{creating ? 'Создаём...' : 'Новое дерево'}</span>
        </button>
      </section>
      <section className="tree-grid">{trees.map((tree) => <TreeCard key={tree.id} tree={tree} href={`/trees/${tree.id}`} />)}</section>
    </PageShell>
  )
}

function CatalogPage({ trees }: Pick<TreeStore, 'trees'>) {
  const [query, setQuery] = useState('')
  const filteredTrees = useMemo(
    () => trees.filter((tree) => tree.privacy === 'public').filter((tree) => `${tree.title} ${tree.surname}`.toLowerCase().includes(query.trim().toLowerCase())),
    [query, trees],
  )

  return (
    <PageShell>
      <section className="listing-hero listing-hero--compact">
        <div><h1>Каталог деревьев</h1><p>Публичные генеалогические деревья сообщества</p></div>
      </section>
      <label className="catalog-search">
        <SearchIcon />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию..." />
      </label>
      <section className="tree-grid">{filteredTrees.map((tree) => <TreeCard key={tree.id} tree={tree} href={`/trees/${tree.id}`} />)}</section>
    </PageShell>
  )
}

export function MainRoutes() {
  const store = useTreeStore()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/trees" replace />} />
      <Route path="/trees" element={<TreesPage trees={store.trees} apiStatus={store.apiStatus} createTree={store.createTree} reloadTrees={store.reloadTrees} />} />
      <Route path="/catalog" element={<CatalogPage trees={store.trees} />} />
      <Route path="/trees/:treeId" element={<EditorPage trees={store.trees} reloadTrees={store.reloadTrees} />} />
      <Route path="/old" element={<OldApp />} />
      <Route path="*" element={<Navigate to="/trees" replace />} />
    </Routes>
  )
}
