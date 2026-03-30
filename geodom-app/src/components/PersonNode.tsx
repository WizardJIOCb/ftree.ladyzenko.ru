import { Handle, Position } from '@xyflow/react'

import type { Person } from '../types'

type PersonNodeProps = {
  data: Person & { selected?: boolean }
}

export function PersonNode({ data }: PersonNodeProps) {
  const initials = `${data.firstName[0] ?? ''}${data.lastName[0] ?? ''}`

  return (
    <div className={`person-node${data.selected ? ' is-selected' : ''}`}>
      <Handle className="person-node__handle" type="target" position={Position.Top} />
      <Handle className="person-node__handle" type="source" position={Position.Bottom} />
      <Handle className="person-node__handle" type="source" position={Position.Right} id="partner" />
      <div className="person-node__avatar">{initials}</div>
      <div className="person-node__body">
        <span className="person-node__branch">{data.branch}</span>
        <strong>{data.firstName} {data.lastName}</strong>
        <span>{data.years}</span>
        <span>{data.place}</span>
      </div>
    </div>
  )
}
