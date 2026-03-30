import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

export type CompactPersonNodeData = {
  label: string
  accent: 'blue' | 'pink' | 'slate'
}

const accentClassName: Record<CompactPersonNodeData['accent'], string> = {
  blue: 'modern-node--blue',
  pink: 'modern-node--pink',
  slate: 'modern-node--slate',
}

export const CompactPersonNode = memo(function CompactPersonNode({
  data,
}: {
  data: CompactPersonNodeData
}) {
  return (
    <div className={`modern-node ${accentClassName[data.accent]}`}>
      <Handle className="modern-node__handle" type="target" position={Position.Top} />
      <Handle className="modern-node__handle" type="source" position={Position.Bottom} />
      <Handle className="modern-node__handle" type="source" position={Position.Left} />
      <Handle className="modern-node__handle" type="source" position={Position.Right} />
      <span className="modern-node__avatar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 12.5a3.75 3.75 0 1 0-3.75-3.75A3.75 3.75 0 0 0 12 12.5Zm0 1.5c-3.06 0-5.75 1.55-5.75 3.5a.75.75 0 0 0 1.5 0c0-.88 1.73-2 4.25-2s4.25 1.12 4.25 2a.75.75 0 0 0 1.5 0c0-1.95-2.69-3.5-5.75-3.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="modern-node__label">{data.label}</span>
    </div>
  )
})
