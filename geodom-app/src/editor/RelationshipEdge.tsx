import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'

type RelationshipEdgeData = {
  label?: string
  helperText?: string
  stroke?: string
  lineThickness?: number
  showLabel?: boolean
  dashArray?: string
  animated?: boolean
  selected?: boolean
  connectedToSelectedPerson?: boolean
}

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [labelSize, setLabelSize] = useState({ width: 220, height: 58 })
  const labelRef = useRef<HTMLDivElement | null>(null)
  const edgeData = (data ?? {}) as RelationshipEdgeData
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 18,
    offset: 14,
  })

  const stroke = edgeData.stroke ?? '#cbb8a8'
  const lineThickness = edgeData.lineThickness ?? 1.8
  const showLabel = Boolean(edgeData.showLabel && hovered && edgeData.label)
  const isSelected = Boolean(edgeData.selected)
  const isConnectedToSelectedPerson = Boolean(edgeData.connectedToSelectedPerson) && !isSelected
  const effectiveStroke = isSelected ? '#e59a3b' : isConnectedToSelectedPerson ? stroke : stroke
  const effectiveStrokeWidth = isSelected ? lineThickness + 1.6 : isConnectedToSelectedPerson ? lineThickness + 1 : lineThickness
  const effectiveOpacity = isSelected ? 1 : isConnectedToSelectedPerson ? 0.98 : edgeData.animated ? 0.92 : 0.84
  const viewportPadding = 16
  const tooltipOffset = 18
  const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 720 : window.innerHeight
  const safeLeft = Math.min(
    Math.max(pointer.x + tooltipOffset, viewportPadding),
    viewportWidth - viewportPadding - labelSize.width,
  )
  const safeTop = Math.min(
    Math.max(pointer.y + tooltipOffset, viewportPadding),
    viewportHeight - viewportPadding - labelSize.height,
  )

  useLayoutEffect(() => {
    if (!showLabel || !labelRef.current) return

    const bounds = labelRef.current.getBoundingClientRect()
    const nextSize = {
      width: Math.ceil(bounds.width),
      height: Math.ceil(bounds.height),
    }

    setLabelSize((current) =>
      current.width === nextSize.width && current.height === nextSize.height ? current : nextSize,
    )
  }, [edgeData.helperText, edgeData.label, showLabel])

  return (
    <>
      {isSelected && (
        <BaseEdge
          id={`${id}-selected-glow`}
          path={edgePath}
          style={{
            stroke: '#f2b669',
            strokeWidth: lineThickness + 7,
            opacity: 0.22,
          }}
        />
      )}
      {isConnectedToSelectedPerson && (
        <BaseEdge
          id={`${id}-person-glow`}
          path={edgePath}
          style={{
            stroke,
            strokeWidth: lineThickness + 5,
            opacity: 0.14,
          }}
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={typeof markerEnd === 'string' ? markerEnd : undefined}
        style={{
          stroke: effectiveStroke,
          strokeWidth: effectiveStrokeWidth,
          strokeDasharray: edgeData.dashArray,
          opacity: effectiveOpacity,
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(lineThickness + 18, 22)}
        pointerEvents="stroke"
        style={{ cursor: 'help' }}
        onMouseEnter={(event) => {
          setHovered(true)
          setPointer({ x: event.clientX, y: event.clientY })
        }}
        onMouseMove={(event) => {
          setPointer({ x: event.clientX, y: event.clientY })
        }}
        onMouseLeave={() => setHovered(false)}
      />

      {showLabel &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={labelRef}
            className="editor-edge-label editor-edge-label--floating"
            style={{
              left: safeLeft,
              top: safeTop,
              borderColor: stroke,
            }}
          >
            <strong>{edgeData.label}</strong>
            {edgeData.helperText && <span>{edgeData.helperText}</span>}
          </div>,
          document.body,
        )}
    </>
  )
}
