import type { RelationshipKind, TreeEditorRelationship, TreePerson, TreeSummary } from '../types'
import { CloseIcon, LinkIcon } from '../ui/icons'
import type { PersonFormState, TreeFormState } from './utils'

type PersonSidebarProps = {
  selectedPerson: TreePerson
  personForm: PersonFormState
  savingPerson: boolean
  personError: string
  relationshipError: string
  linkingRelationship: boolean
  relationshipTargets: TreePerson[]
  relationshipForm: { targetId: string; kind: RelationshipKind }
  selectedConnections: Array<{ id: string; kind: TreeEditorRelationship['kind']; label: string }>
  onClose: () => void
  onPersonFormChange: (patch: Partial<PersonFormState>) => void
  onRelationshipFormChange: (patch: { targetId?: string; kind?: RelationshipKind }) => void
  onSavePerson: () => void
  onCreateRelationship: () => void
  onDeletePerson: () => void
}

type TreeSidebarProps = {
  tree: TreeSummary
  treeForm: TreeFormState
  personsCount: number
  relationshipsCount: number
  savingTree: boolean
  treeError: string
  onClose: () => void
  onTreeFormChange: (patch: Partial<TreeFormState>) => void
  onSaveTree: () => void
}

type PersonListSidebarProps = {
  persons: TreePerson[]
  selectedPersonId: string | null
  onClose: () => void
  onOpenPerson: (personId: string) => void
  onDeletePerson: (personId: string) => void
}

export function PersonSidebar(props: PersonSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar__header">
        <div>
          <span className="editor-sidebar__eyebrow">Персона</span>
          <h3>{props.selectedPerson.label}</h3>
        </div>
        <button className="editor-sidebar__close" onClick={props.onClose} type="button" aria-label="Закрыть"><CloseIcon /></button>
      </div>

      <div className="editor-sidebar__section">
        <label className="editor-field"><span>Имя</span><input value={props.personForm.firstName} onChange={(event) => props.onPersonFormChange({ firstName: event.target.value })} /></label>
        <label className="editor-field"><span>Фамилия</span><input value={props.personForm.lastName} onChange={(event) => props.onPersonFormChange({ lastName: event.target.value })} /></label>
        <label className="editor-field"><span>Годы жизни</span><input value={props.personForm.years} onChange={(event) => props.onPersonFormChange({ years: event.target.value })} /></label>
        <label className="editor-field"><span>Место</span><input value={props.personForm.place} onChange={(event) => props.onPersonFormChange({ place: event.target.value })} /></label>
        <label className="editor-field"><span>Ветка</span><input value={props.personForm.branch} onChange={(event) => props.onPersonFormChange({ branch: event.target.value })} /></label>
        <label className="editor-field">
          <span>Цвет карточки</span>
          <select value={props.personForm.accent} onChange={(event) => props.onPersonFormChange({ accent: event.target.value as TreePerson['accent'] })}>
            <option value="blue">Голубой</option>
            <option value="pink">Розовый</option>
            <option value="slate">Сланцевый</option>
          </select>
        </label>
        <label className="editor-field"><span>Заметка</span><textarea rows={4} value={props.personForm.note} onChange={(event) => props.onPersonFormChange({ note: event.target.value })} /></label>
        {props.personError && <p className="editor-sidebar__error">{props.personError}</p>}
        <div className="editor-sidebar__actions">
          <button className="editor-sidebar__save" disabled={props.savingPerson} onClick={props.onSavePerson} type="button">{props.savingPerson ? 'Сохраняем...' : 'Сохранить персону'}</button>
          <button className="editor-sidebar__danger" onClick={props.onDeletePerson} type="button">Удалить</button>
        </div>
      </div>

      <div className="editor-sidebar__section editor-sidebar__section--soft">
        <div className="editor-sidebar__subhead"><LinkIcon /><strong>Связи</strong></div>
        <label className="editor-field">
          <span>Тип связи</span>
          <select value={props.relationshipForm.kind} onChange={(event) => props.onRelationshipFormChange({ kind: event.target.value as RelationshipKind })}>
            <option value="parent-child">Родитель → ребёнок</option>
            <option value="partner">Партнёрство</option>
          </select>
        </label>
        <label className="editor-field">
          <span>Связать с</span>
          <select value={props.relationshipForm.targetId} onChange={(event) => props.onRelationshipFormChange({ targetId: event.target.value })}>
            {props.relationshipTargets.length === 0 && <option value="">Нет доступных персон</option>}
            {props.relationshipTargets.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}
          </select>
        </label>
        {props.relationshipError && <p className="editor-sidebar__error">{props.relationshipError}</p>}
        <button className="editor-sidebar__secondary" disabled={!props.relationshipForm.targetId || props.linkingRelationship} onClick={props.onCreateRelationship} type="button">
          {props.linkingRelationship ? 'Создаём...' : 'Добавить связь'}
        </button>
        <div className="editor-link-list">
          {props.selectedConnections.length === 0 && <p className="editor-sidebar__hint">Пока нет связанных персон.</p>}
          {props.selectedConnections.map((item) => <div key={item.id} className="editor-link-list__item"><span>{item.kind === 'partner' ? 'Партнёрство' : 'Родительская связь'}</span><strong>{item.label}</strong></div>)}
        </div>
      </div>
    </aside>
  )
}

export function TreeSidebar(props: TreeSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar__header">
        <div>
          <span className="editor-sidebar__eyebrow">Дерево</span>
          <h3>{props.tree.title}</h3>
        </div>
        <button className="editor-sidebar__close" onClick={props.onClose} type="button" aria-label="Закрыть"><CloseIcon /></button>
      </div>

      <div className="editor-sidebar__section">
        <label className="editor-field"><span>Название</span><input value={props.treeForm.title} onChange={(event) => props.onTreeFormChange({ title: event.target.value })} /></label>
        <label className="editor-field"><span>Основная фамилия</span><input value={props.treeForm.surname} onChange={(event) => props.onTreeFormChange({ surname: event.target.value })} /></label>
        <label className="editor-field">
          <span>Режим доступа</span>
          <select value={props.treeForm.privacy} onChange={(event) => props.onTreeFormChange({ privacy: event.target.value as TreeSummary['privacy'] })}>
            <option value="private">Приватное</option>
            <option value="shared">Совместное</option>
            <option value="public">Публичное</option>
          </select>
        </label>
        <div className="editor-tree-stats">
          <div><span>Персон</span><strong>{props.personsCount}</strong></div>
          <div><span>Связей</span><strong>{props.relationshipsCount}</strong></div>
        </div>
        <p className="editor-sidebar__hint">Последнее обновление: {props.tree.lastUpdated}</p>
        {props.treeError && <p className="editor-sidebar__error">{props.treeError}</p>}
        <button className="editor-sidebar__save" disabled={props.savingTree} onClick={props.onSaveTree} type="button">{props.savingTree ? 'Сохраняем...' : 'Сохранить дерево'}</button>
      </div>
    </aside>
  )
}

export function PersonListSidebar(props: PersonListSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar__header">
        <div>
          <span className="editor-sidebar__eyebrow">Персоны</span>
          <h3>{props.persons.length} в дереве</h3>
        </div>
        <button className="editor-sidebar__close" onClick={props.onClose} type="button" aria-label="Закрыть"><CloseIcon /></button>
      </div>

      <div className="editor-person-list">
        {props.persons.length === 0 && <p className="editor-sidebar__hint">Пока нет персон.</p>}
        {props.persons.map((person) => (
          <div key={person.id} className={`editor-person-list__item${props.selectedPersonId === person.id ? ' is-selected' : ''}`}>
            <button className="editor-person-list__main" onClick={() => props.onOpenPerson(person.id)} type="button">
              <strong>{person.label}</strong>
              <span>{person.years || person.place || person.branch || 'Без уточнений'}</span>
            </button>
            <div className="editor-person-list__actions">
              <button className="editor-sidebar__secondary editor-sidebar__secondary--positive" onClick={() => props.onOpenPerson(person.id)} type="button">Изменить</button>
              <button className="editor-sidebar__danger" onClick={() => props.onDeletePerson(person.id)} type="button">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
