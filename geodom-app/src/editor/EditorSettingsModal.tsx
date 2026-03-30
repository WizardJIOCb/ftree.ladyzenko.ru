import type { EditorViewSettings } from './utils'
import { CloseIcon } from '../ui/icons'

type EditorSettingsModalProps = {
  settings: EditorViewSettings
  onClose: () => void
  onChange: (patch: Partial<EditorViewSettings>) => void
}

export function EditorSettingsModal({ settings, onClose, onChange }: EditorSettingsModalProps) {
  return (
    <div className="editor-modal-backdrop" onClick={onClose} role="presentation">
      <section className="editor-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
        <div className="editor-modal__header">
          <div>
            <span className="editor-sidebar__eyebrow">Настройки вида</span>
            <h3>Отображение дерева</h3>
          </div>
          <button className="editor-sidebar__close" onClick={onClose} type="button" aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>

        <div className="editor-modal__body">
          <label className="editor-field">
            <span>Толщина линий связи</span>
            <input
              type="range"
              min="1"
              max="4.5"
              step="0.1"
              value={settings.lineThickness}
              onChange={(event) => onChange({ lineThickness: Number(event.target.value) })}
            />
            <strong className="editor-modal__value">{settings.lineThickness.toFixed(1)} px</strong>
          </label>

          <label className="editor-check">
            <input
              type="checkbox"
              checked={settings.showRelationshipLabels}
              onChange={(event) => onChange({ showRelationshipLabels: event.target.checked })}
            />
            <span>Показывать текст связи при наведении на линию</span>
          </label>

          <label className="editor-check">
            <input
              type="checkbox"
              checked={settings.autoColorNodes}
              onChange={(event) => onChange({ autoColorNodes: event.target.checked })}
            />
            <span>Автоматически подбирать разные цвета людям и веткам</span>
          </label>

          <p className="editor-sidebar__hint">
            Линии уже окрашиваются от исходной персоны, чтобы было проще считывать семейные ветки и направление связи.
          </p>
        </div>
      </section>
    </div>
  )
}
