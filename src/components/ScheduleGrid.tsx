'use client'

import { useRef, useState } from 'react'
import { SCHEDULE_HOURS, type ScheduleBlock } from '@/content/journal-fields'

const ROW = 34

type Props = {
  blocks: ScheduleBlock[]
  onChange: (blocks: ScheduleBlock[]) => void
}

/**
 * The day, as blocks of time rather than a line per hour.
 *
 * Press an empty hour to start something, or press and drag down to block out
 * several at once. A block can be dragged longer or shorter by its bottom edge,
 * so a three hour session is one label and one drag rather than three
 * identical entries.
 */
export function ScheduleGrid({ blocks, onChange }: Props) {
  const grid = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<ScheduleBlock | null>(null)
  const [focusOn, setFocusOn] = useState<number | null>(null)

  const sorted = [...blocks].sort((a, b) => a.start - b.start)

  function rowAt(clientY: number): number {
    const box = grid.current?.getBoundingClientRect()
    if (!box) return 0
    const row = Math.floor((clientY - box.top) / ROW)
    return Math.min(SCHEDULE_HOURS.length - 1, Math.max(0, row))
  }

  /** A block cannot run into the one below it. */
  function ceilingFor(start: number, ignore?: number): number {
    const next = sorted.find((b, i) => i !== ignore && b.start > start)
    return next ? next.start - 1 : SCHEDULE_HOURS.length - 1
  }

  function occupied(row: number): boolean {
    return sorted.some((b) => row >= b.start && row <= b.end)
  }

  function startDraw(event: React.PointerEvent) {
    if (event.button !== 0) return
    const start = rowAt(event.clientY)
    if (occupied(start)) return

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture is a convenience. The window listeners below do the work.
    }
    const ceiling = ceilingFor(start)
    setDraft({ start, end: start, label: '' })

    const move = (e: PointerEvent) => {
      const end = Math.min(ceiling, Math.max(start, rowAt(e.clientY)))
      setDraft({ start, end, label: '' })
    }
    const up = (e: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const end = Math.min(ceiling, Math.max(start, rowAt(e.clientY)))
      setDraft(null)
      onChange([...blocks, { start, end, label: '' }])
      setFocusOn(start)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function startResize(event: React.PointerEvent, index: number) {
    event.preventDefault()
    event.stopPropagation()
    const block = sorted[index]
    const ceiling = ceilingFor(block.start, index)

    const move = (e: PointerEvent) => {
      const end = Math.min(ceiling, Math.max(block.start, rowAt(e.clientY)))
      onChange(sorted.map((b, i) => (i === index ? { ...b, end } : b)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function update(index: number, patch: Partial<ScheduleBlock>) {
    onChange(sorted.map((b, i) => (i === index ? { ...b, ...patch } : b)))
  }

  function remove(index: number) {
    onChange(sorted.filter((_, i) => i !== index))
  }

  return (
    <div className="relative border border-line select-none">
      {/* The hours themselves, and the surface you press to start a block. */}
      <div
        ref={grid}
        onPointerDown={startDraw}
        className="relative cursor-crosshair"
        style={{ touchAction: 'none' }}
      >
        {SCHEDULE_HOURS.map((hour) => (
          <div
            key={hour}
            className="flex items-center border-b border-line last:border-b-0"
            style={{ height: ROW }}
          >
            <span className="label w-14 shrink-0 pl-3">{hour}</span>
          </div>
        ))}

        {draft ? (
          <Block
            block={draft}
            className="border-ink-20 bg-ink-8"
            style={{ pointerEvents: 'none' }}
          />
        ) : null}

        {sorted.map((block, i) => (
          <Block key={`${block.start}-${i}`} block={block} className="border-ink bg-surface">
            <input
              autoFocus={focusOn === block.start}
              value={block.label}
              onChange={(e) => update(i, { label: e.target.value })}
              onBlur={() => {
                setFocusOn(null)
                if (!block.label.trim()) remove(i)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Add something"
              className="w-full bg-transparent px-2 py-1 text-[0.875rem] outline-none placeholder:text-ink-20"
            />
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => remove(i)}
              aria-label={`Remove ${block.label || 'block'}`}
              className="label shrink-0 px-2 hover:!text-ink"
            >
              ×
            </button>
            <span
              onPointerDown={(e) => startResize(e, i)}
              role="slider"
              tabIndex={0}
              aria-label={`Length of ${block.label || 'block'}, in hours`}
              aria-valuenow={block.end - block.start + 1}
              aria-valuemin={1}
              aria-valuemax={SCHEDULE_HOURS.length - block.start}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  update(i, { end: Math.min(ceilingFor(block.start, i), block.end + 1) })
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  update(i, { end: Math.max(block.start, block.end - 1) })
                }
              }}
              style={{ touchAction: 'none' }}
              className="absolute inset-x-0 bottom-0 flex h-2.5 cursor-ns-resize items-end justify-center focus:outline-none"
            >
              <span className="mb-[3px] h-[2px] w-6 rounded-full bg-ink-20" />
            </span>
          </Block>
        ))}
      </div>
    </div>
  )
}

function Block({
  block,
  className,
  style,
  children,
}: {
  block: ScheduleBlock
  className: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  return (
    <div
      className={`absolute right-1 flex items-start border ${className}`}
      style={{
        top: block.start * ROW + 2,
        height: (block.end - block.start + 1) * ROW - 4,
        left: '3.75rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
