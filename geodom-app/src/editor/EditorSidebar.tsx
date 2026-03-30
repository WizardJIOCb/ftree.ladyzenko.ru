import { useEffect, useRef, useState } from 'react'

import type { TreeEditorRelationship, TreePerson, TreePersonResearchStatus, TreeSummary } from '../types'
import { CloseIcon, LinkIcon } from '../ui/icons'
import type { PersonFormState, TreeFormState } from './utils'

export type RelationshipRole = 'parent' | 'child' | 'partner' | 'related'

type PersonSidebarProps = {
  selectedPerson: TreePerson
  personForm: PersonFormState
  savingPerson: boolean
  personError: string
  relationshipError: string
  linkingRelationship: boolean
  editingRelationshipId: string | null
  relationshipTargets: TreePerson[]
  relationshipForm: { targetId: string; role: RelationshipRole; note: string; researchStatus: TreePersonResearchStatus }
  selectedConnections: Array<{
    id: string
    kind: TreeEditorRelationship['kind']
    label: string
    role: RelationshipRole
    personId: string
    note: string
    researchStatus: TreeEditorRelationship['researchStatus']
  }>
  onClose: () => void
  onReturnToRelationship?: () => void
  onPersonFormChange: (patch: Partial<PersonFormState>) => void
  onCommitPersonColors: (personId: string, patch: Pick<PersonFormState, 'panelColor' | 'textColor'>) => void
  onRelationshipFormChange: (patch: {
    targetId?: string
    role?: RelationshipRole
    note?: string
    researchStatus?: TreePersonResearchStatus
  }) => void
  onSavePerson: () => void
  onCreateRelationship: () => void
  onDeletePerson: () => void
  onOpenConnectedPerson: (personId: string) => void
  onStartRelationshipEdit: (relationshipId: string) => void
  onCancelRelationshipEdit: () => void
  onDeleteRelationship: (relationshipId: string) => void
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
  onFocusPerson: (personId: string) => void
  onEditPerson: (personId: string) => void
  onDeletePerson: (personId: string) => void
}

type RelationshipSidebarProps = {
  relationship: TreeEditorRelationship
  sourcePerson: TreePerson | null
  targetPerson: TreePerson | null
  persons: TreePerson[]
  form: {
    sourceId: string
    targetId: string
    kind: TreeEditorRelationship['kind']
    note: string
    researchStatus: TreeEditorRelationship['researchStatus']
  }
  saving: boolean
  error: string
  onClose: () => void
  onFormChange: (patch: Partial<RelationshipSidebarProps['form']>) => void
  onSave: () => void
  onDelete: () => void
  onFocusPerson: (personId: string) => void
  onEditPerson: (personId: string) => void
}

function getResearchLabel(status: TreePersonResearchStatus) {
  if (status === 'confirmed') return 'Подтверждено'
  if (status === 'in_review') return 'Проверяется'
  return 'Гипотеза'
}

function getRelationshipRoleLabel(role: RelationshipRole) {
  if (role === 'partner') return 'Партнёр'
  if (role === 'parent') return 'Родитель'
  if (role === 'child') return 'Ребёнок'
  return 'Исследовательская связь'
}

function getRelationshipKindLabel(kind: TreeEditorRelationship['kind']) {
  if (kind === 'partner') return 'Партнёрская связь'
  if (kind === 'related') return 'Исследовательская связь'
  return 'Родитель → ребёнок'
}

function PersonJumpCard({
  title,
  person,
  onFocus,
  onEdit,
}: {
  title: string
  person: TreePerson | null
  onFocus: () => void
  onEdit: () => void
}) {
  return (
    <div className="editor-connection-card">
      <span>{title}</span>
      <strong>{person?.label ?? 'Персона не найдена'}</strong>
      <small>{person ? person.years || person.place || person.branch || 'Без уточнений' : 'Связь указывает на отсутствующую запись'}</small>
      {person && (
        <div className="editor-connection-card__actions">
          <button className="editor-link-list__button" onClick={onFocus} type="button">
            К персоне
          </button>
          <button className="editor-link-list__button editor-link-list__button--positive" onClick={onEdit} type="button">
            Изменить персону
          </button>
        </div>
      )}
    </div>
  )
}

export function PersonSidebar(props: PersonSidebarProps) {
  const [panelColorDraft, setPanelColorDraft] = useState(props.personForm.panelColor || '#fffdf9')
  const [textColorDraft, setTextColorDraft] = useState(props.personForm.textColor || '#243154')
  const panelColorTimerRef = useRef<number | null>(null)
  const textColorTimerRef = useRef<number | null>(null)
  const selectedPersonIdRef = useRef(props.selectedPerson.id)

  useEffect(() => {
    if (panelColorTimerRef.current !== null) {
      window.clearTimeout(panelColorTimerRef.current)
      panelColorTimerRef.current = null
    }
    if (textColorTimerRef.current !== null) {
      window.clearTimeout(textColorTimerRef.current)
      textColorTimerRef.current = null
    }
    selectedPersonIdRef.current = props.selectedPerson.id
    setPanelColorDraft(props.personForm.panelColor || '#fffdf9')
    setTextColorDraft(props.personForm.textColor || '#243154')
  }, [props.personForm.panelColor, props.personForm.textColor, props.selectedPerson.id])

  useEffect(
    () => () => {
      if (panelColorTimerRef.current !== null) {
        window.clearTimeout(panelColorTimerRef.current)
      }
      if (textColorTimerRef.current !== null) {
        window.clearTimeout(textColorTimerRef.current)
      }
    },
    [],
  )

  function schedulePanelColorCommit(value: string) {
    if (panelColorTimerRef.current !== null) {
      window.clearTimeout(panelColorTimerRef.current)
    }

    const targetPersonId = props.selectedPerson.id
    panelColorTimerRef.current = window.setTimeout(() => {
      if (selectedPersonIdRef.current !== targetPersonId) return
      props.onCommitPersonColors(targetPersonId, { panelColor: value, textColor: textColorDraft })
      panelColorTimerRef.current = null
    }, 140)
  }

  function scheduleTextColorCommit(value: string) {
    if (textColorTimerRef.current !== null) {
      window.clearTimeout(textColorTimerRef.current)
    }

    const targetPersonId = props.selectedPerson.id
    textColorTimerRef.current = window.setTimeout(() => {
      if (selectedPersonIdRef.current !== targetPersonId) return
      props.onCommitPersonColors(targetPersonId, { panelColor: panelColorDraft, textColor: value })
      textColorTimerRef.current = null
    }, 140)
  }

  function flushPanelColorCommit(value: string) {
    if (panelColorTimerRef.current !== null) {
      window.clearTimeout(panelColorTimerRef.current)
      panelColorTimerRef.current = null
    }
    if (selectedPersonIdRef.current === props.selectedPerson.id) {
      props.onCommitPersonColors(props.selectedPerson.id, { panelColor: value, textColor: textColorDraft })
    }
  }

  function flushTextColorCommit(value: string) {
    if (textColorTimerRef.current !== null) {
      window.clearTimeout(textColorTimerRef.current)
      textColorTimerRef.current = null
    }
    if (selectedPersonIdRef.current === props.selectedPerson.id) {
      props.onCommitPersonColors(props.selectedPerson.id, { panelColor: panelColorDraft, textColor: value })
    }
  }

  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar__header">
        <div>
          <span className="editor-sidebar__eyebrow">Персона</span>
          <h3>{props.selectedPerson.label}</h3>
          <span className={`editor-research-badge editor-research-badge--${props.personForm.researchStatus}`}>
            {getResearchLabel(props.personForm.researchStatus)}
          </span>
        </div>
        <div className="editor-sidebar__header-actions">
          {props.onReturnToRelationship && (
            <button className="editor-sidebar__ghost" onClick={props.onReturnToRelationship} type="button">
              К связи
            </button>
          )}
          <button className="editor-sidebar__close" onClick={props.onClose} type="button" aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="editor-sidebar__section">
        <label className="editor-field">
          <span>Имя</span>
          <input value={props.personForm.firstName} onChange={(event) => props.onPersonFormChange({ firstName: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Фамилия</span>
          <input value={props.personForm.lastName} onChange={(event) => props.onPersonFormChange({ lastName: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Годы жизни</span>
          <input value={props.personForm.years} onChange={(event) => props.onPersonFormChange({ years: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Место</span>
          <input value={props.personForm.place} onChange={(event) => props.onPersonFormChange({ place: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Ветка</span>
          <input value={props.personForm.branch} onChange={(event) => props.onPersonFormChange({ branch: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Статус проверки</span>
          <select
            value={props.personForm.researchStatus}
            onChange={(event) => props.onPersonFormChange({ researchStatus: event.target.value as TreePerson['researchStatus'] })}
          >
            <option value="confirmed">Подтверждено</option>
            <option value="in_review">Проверяется</option>
            <option value="hypothesis">Гипотеза</option>
          </select>
        </label>
        <label className="editor-field">
          <span>Базовый акцент</span>
          <select value={props.personForm.accent} onChange={(event) => props.onPersonFormChange({ accent: event.target.value as TreePerson['accent'] })}>
            <option value="blue">Голубой</option>
            <option value="pink">Розовый</option>
            <option value="slate">Сланцевый</option>
          </select>
        </label>
        <div className="editor-color-grid">
          <label className="editor-field">
            <span>Фон панели</span>
            <input
              type="color"
              value={panelColorDraft}
              onChange={(event) => {
                setPanelColorDraft(event.target.value)
                schedulePanelColorCommit(event.target.value)
              }}
              onBlur={(event) => flushPanelColorCommit(event.target.value)}
            />
          </label>
          <label className="editor-field">
            <span>Цвет ФИО</span>
            <input
              type="color"
              value={textColorDraft}
              onChange={(event) => {
                setTextColorDraft(event.target.value)
                scheduleTextColorCommit(event.target.value)
              }}
              onBlur={(event) => flushTextColorCommit(event.target.value)}
            />
          </label>
        </div>
        <label className="editor-field">
          <span>Варианты имени и фамилии</span>
          <textarea
            rows={4}
            value={props.personForm.aliases}
            onChange={(event) => props.onPersonFormChange({ aliases: event.target.value })}
            placeholder="Например: Ладыженко / Лодиженко / Ладыженко"
          />
        </label>
        <label className="editor-field">
          <span>Заметка</span>
          <textarea rows={4} value={props.personForm.note} onChange={(event) => props.onPersonFormChange({ note: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Источники и доказательства</span>
          <textarea
            rows={6}
            value={props.personForm.sources}
            onChange={(event) => props.onPersonFormChange({ sources: event.target.value })}
            placeholder="Сюда удобно складывать архивы, карточки поиска и семейные сведения."
          />
        </label>
        {props.personError && <p className="editor-sidebar__error">{props.personError}</p>}
        <div className="editor-sidebar__actions">
          <button className="editor-sidebar__save" disabled={props.savingPerson} onClick={props.onSavePerson} type="button">
            {props.savingPerson ? 'Сохраняем...' : 'Сохранить персону'}
          </button>
          <button className="editor-sidebar__danger" onClick={props.onDeletePerson} type="button">
            Удалить
          </button>
        </div>
      </div>

      <div className="editor-sidebar__section editor-sidebar__section--soft">
        <div className="editor-sidebar__subhead">
          <LinkIcon />
          <strong>Связи</strong>
        </div>

        <label className="editor-field">
          <span>Тип связи</span>
          <select value={props.relationshipForm.role} onChange={(event) => props.onRelationshipFormChange({ role: event.target.value as RelationshipRole })}>
            <option value="parent">Родитель для выбранной персоны</option>
            <option value="child">Ребёнок выбранной персоны</option>
            <option value="partner">Партнёр</option>
            <option value="related">Исследовательская связь</option>
          </select>
        </label>

        <label className="editor-field">
          <span>Связать с</span>
          <select value={props.relationshipForm.targetId} onChange={(event) => props.onRelationshipFormChange({ targetId: event.target.value })}>
            {props.relationshipTargets.length === 0 && <option value="">Нет доступных персон</option>}
            {props.relationshipTargets.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </label>

        <label className="editor-field">
          <span>Статус связи</span>
          <select
            value={props.relationshipForm.researchStatus}
            onChange={(event) => props.onRelationshipFormChange({ researchStatus: event.target.value as TreePersonResearchStatus })}
          >
            <option value="confirmed">Подтверждено</option>
            <option value="in_review">Проверяется</option>
            <option value="hypothesis">Гипотеза</option>
          </select>
        </label>

        <label className="editor-field">
          <span>Заметка по связи</span>
          <textarea
            rows={3}
            value={props.relationshipForm.note}
            onChange={(event) => props.onRelationshipFormChange({ note: event.target.value })}
            placeholder="Например: вероятный брат по семейному чату, нужна проверка по документам."
          />
        </label>

        {props.relationshipError && <p className="editor-sidebar__error">{props.relationshipError}</p>}
        {props.editingRelationshipId && <p className="editor-sidebar__hint">Сейчас редактируется существующая связь.</p>}

        <div className="editor-sidebar__actions">
          <button className="editor-sidebar__secondary" disabled={!props.relationshipForm.targetId || props.linkingRelationship} onClick={props.onCreateRelationship} type="button">
            {props.linkingRelationship ? 'Сохраняем...' : props.editingRelationshipId ? 'Сохранить связь' : 'Добавить связь'}
          </button>
          {props.editingRelationshipId && (
            <button className="editor-sidebar__ghost" onClick={props.onCancelRelationshipEdit} type="button">
              Отмена
            </button>
          )}
        </div>

        <div className="editor-link-list">
          {props.selectedConnections.length === 0 && <p className="editor-sidebar__hint">Пока нет связанных персон.</p>}
          {props.selectedConnections.map((item) => (
            <div key={item.id} className={`editor-link-list__item${props.editingRelationshipId === item.id ? ' is-editing' : ''}`}>
              <span>{getRelationshipRoleLabel(item.role)}</span>
              <strong>{item.label}</strong>
              <div className="editor-link-list__meta">
                <span className={item.researchStatus === 'hypothesis' ? 'editor-link-list__meta--hypothesis' : ''}>
                  {getResearchLabel(item.researchStatus)}
                </span>
              </div>
              {item.note && <p className="editor-link-list__note">{item.note}</p>}
              <div className="editor-link-list__actions">
                <button className="editor-link-list__button" onClick={() => props.onOpenConnectedPerson(item.personId)} type="button">
                  К персоне
                </button>
                <button className="editor-link-list__button editor-link-list__button--positive" onClick={() => props.onStartRelationshipEdit(item.id)} type="button">
                  Изменить
                </button>
                <button className="editor-link-list__button editor-link-list__button--danger" onClick={() => props.onDeleteRelationship(item.id)} type="button">
                  Удалить связь
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export function RelationshipSidebar(props: RelationshipSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar__header">
        <div>
          <span className="editor-sidebar__eyebrow">Связь</span>
          <h3>{getRelationshipKindLabel(props.relationship.kind)}</h3>
          <span className={`editor-research-badge editor-research-badge--${props.form.researchStatus}`}>
            {getResearchLabel(props.form.researchStatus)}
          </span>
        </div>
        <button className="editor-sidebar__close" onClick={props.onClose} type="button" aria-label="Закрыть">
          <CloseIcon />
        </button>
      </div>

      <div className="editor-sidebar__section editor-sidebar__section--soft">
        <PersonJumpCard
          title="От кого"
          person={props.sourcePerson}
          onFocus={() => props.sourcePerson && props.onFocusPerson(props.sourcePerson.id)}
          onEdit={() => props.sourcePerson && props.onEditPerson(props.sourcePerson.id)}
        />
        <PersonJumpCard
          title="К кому"
          person={props.targetPerson}
          onFocus={() => props.targetPerson && props.onFocusPerson(props.targetPerson.id)}
          onEdit={() => props.targetPerson && props.onEditPerson(props.targetPerson.id)}
        />
      </div>

      <div className="editor-sidebar__section">
        <label className="editor-field">
          <span>От кого</span>
          <select value={props.form.sourceId} onChange={(event) => props.onFormChange({ sourceId: event.target.value })}>
            {props.persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field">
          <span>К кому</span>
          <select value={props.form.targetId} onChange={(event) => props.onFormChange({ targetId: event.target.value })}>
            {props.persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field">
          <span>Тип связи</span>
          <select value={props.form.kind} onChange={(event) => props.onFormChange({ kind: event.target.value as TreeEditorRelationship['kind'] })}>
            <option value="parent-child">Родитель → ребёнок</option>
            <option value="partner">Партнёрская связь</option>
            <option value="related">Исследовательская связь</option>
          </select>
        </label>
        <label className="editor-field">
          <span>Статус связи</span>
          <select
            value={props.form.researchStatus}
            onChange={(event) => props.onFormChange({ researchStatus: event.target.value as TreeEditorRelationship['researchStatus'] })}
          >
            <option value="confirmed">Подтверждено</option>
            <option value="in_review">Проверяется</option>
            <option value="hypothesis">Гипотеза</option>
          </select>
        </label>
        <label className="editor-field">
          <span>Заметка</span>
          <textarea rows={4} value={props.form.note} onChange={(event) => props.onFormChange({ note: event.target.value })} />
        </label>
        {props.error && <p className="editor-sidebar__error">{props.error}</p>}
        <div className="editor-sidebar__actions">
          <button className="editor-sidebar__save" disabled={props.saving} onClick={props.onSave} type="button">
            {props.saving ? 'Сохраняем...' : 'Сохранить связь'}
          </button>
          <button className="editor-sidebar__danger" onClick={props.onDelete} type="button">
            Удалить
          </button>
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
        <button className="editor-sidebar__close" onClick={props.onClose} type="button" aria-label="Закрыть">
          <CloseIcon />
        </button>
      </div>

      <div className="editor-sidebar__section">
        <label className="editor-field">
          <span>Название</span>
          <input value={props.treeForm.title} onChange={(event) => props.onTreeFormChange({ title: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Основная фамилия</span>
          <input value={props.treeForm.surname} onChange={(event) => props.onTreeFormChange({ surname: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Режим доступа</span>
          <select value={props.treeForm.privacy} onChange={(event) => props.onTreeFormChange({ privacy: event.target.value as TreeSummary['privacy'] })}>
            <option value="private">Приватное</option>
            <option value="shared">Совместное</option>
            <option value="public">Публичное</option>
          </select>
        </label>
        <div className="editor-tree-stats">
          <div>
            <span>Персон</span>
            <strong>{props.personsCount}</strong>
          </div>
          <div>
            <span>Связей</span>
            <strong>{props.relationshipsCount}</strong>
          </div>
        </div>
        <p className="editor-sidebar__hint">Последнее обновление: {props.tree.lastUpdated}</p>
        {props.treeError && <p className="editor-sidebar__error">{props.treeError}</p>}
        <button className="editor-sidebar__save" disabled={props.savingTree} onClick={props.onSaveTree} type="button">
          {props.savingTree ? 'Сохраняем...' : 'Сохранить дерево'}
        </button>
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
        <button className="editor-sidebar__close" onClick={props.onClose} type="button" aria-label="Закрыть">
          <CloseIcon />
        </button>
      </div>

      <div className="editor-person-list">
        {props.persons.length === 0 && <p className="editor-sidebar__hint">Пока нет персон.</p>}
        {props.persons.map((person) => (
          <div key={person.id} className={`editor-person-list__item${props.selectedPersonId === person.id ? ' is-selected' : ''}`}>
            <button className="editor-person-list__main" onClick={() => props.onFocusPerson(person.id)} type="button">
              <strong>{person.label}</strong>
              <span>{person.years || person.place || person.branch || 'Без уточнений'}</span>
            </button>
            <div className="editor-person-list__actions">
              <button className="editor-sidebar__secondary editor-sidebar__secondary--positive" onClick={() => props.onEditPerson(person.id)} type="button">
                Изменить
              </button>
              <button className="editor-sidebar__danger" onClick={() => props.onDeletePerson(person.id)} type="button">
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
