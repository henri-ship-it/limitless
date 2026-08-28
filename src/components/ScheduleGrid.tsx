'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SCHEDULE_START,
  SCHEDULE_LENGTH,
  hourLabel,
  scheduleHours,
  type ScheduleBlock,
} from '@/content/journal-fields'

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
const START_KEY = 'limitless:schedule-start'

export function ScheduleGrid({ blocks, onChange }: Props) {
  const grid = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState(DEFAULT_SCHEDULE_START)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const hours = scheduleHours(start)

  /*
   * The start hour is a preference for this device rather than part of the
   * entry: it says how you like to see the day, not what you did with it.
   */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(START_KEY)
      if (stored !== null) setStart(Number(stored))
    } catch {
      // Blocked storage just means the printed default.
    }
  }, [])

  function chooseStart(hour: number) {
    setStart(hour)
    try {
      window.localStorage.setItem(START_KEY, String(hour))
    } catch {
      // Nothing useful to do.
    }
  }
  const [draft, setDraft] = useState<ScheduleBlock | null>(null)
  const [focusOn, setFocusOn] = useState<number | null>(null)
  const justCreated = useRef<HTMLInputElement | null>(null)

  /*
   * A block that has just been drawn takes focus so it can be named. This runs
   * once and then forgets, rather than leaving a flag set that React would act
   * on again the next time it rebuilt the input. That was pulling focus back to
   * the schedule from wherever the member had moved to.
   */
  useEffect(() => {
    if (focusOn === null) return
    justCreated.current?.focus()
    justCreated.current = null
    setFocusOn(null)
  }, [focusOn])


  const sorted = [...blocks].sort((a, b) => a.start - b.start)

  function rowAt(clientY: number): number {
    const box = grid.current?.getBoundingClientRect()
    if (!box) return 0
    const row = Math.floor((clientY - box.top) / ROW)
    return Math.min(SCHEDULE_LENGTH - 1, Math.max(0, row))
  }

  /** A block cannot run into the one below it. */
  function ceilingFor(start: number, ignore?: number): number {
    const next = sorted.find((b, i) => i !== ignore && b.start > start)
    return next ? next.start - 1 : SCHEDULE_LENGTH - 1
  }

  function occupied(row: number): boolean {
    return sorted.some((b) => row >= b.start && row <= b.end)
  }

  function startDraw(event: React.PointerEvent) {
    if (event.button !== 0) return
    // On touch the page owns vertical movement, so a tap makes a single hour
    // and the handle does the rest.
    const drawable = event.pointerType !== 'touch'
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
      if (!drawable) return
      const end = Math.min(ceiling, Math.max(start, rowAt(e.clientY)))
      setDraft({ start, end, label: '' })
    }
    const up = (e: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const end = drawable ? Math.min(ceiling, Math.max(start, rowAt(e.clientY))) : start
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
    <div className="relative select-none">
      <div className="mb-2 flex items-center justify-between">
        <p className="label">
          {hours[0]} to {hours[hours.length - 1]}
        </p>
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-expanded={settingsOpen}
          aria-label="Change the hour your day starts"
          className="label flex items-center gap-1.5 hover:!text-ink"
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
            <circle cx="6" cy="6" r="1.9" />
            <path d="M6 1v1.3M6 9.7V11M11 6H9.7M2.3 6H1M9.5 2.5l-.9.9M3.4 8.6l-.9.9M9.5 9.5l-.9-.9M3.4 3.4l-.9-.9" strokeLinecap="round" />
          </svg>
          Start
        </button>
      </div>

      {settingsOpen ? (
        <div className="mb-2 border border-line p-3">
          <p className="label mb-2">Your day starts at</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 3).map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => chooseStart(hour)}
                aria-pressed={start === hour}
                className={`pill ${start === hour ? '!border-accent-ink !bg-accent-soft !text-ink' : 'hover:!border-line-strong hover:!text-ink'}`}
              >
                {hourLabel(hour)}
              </button>
            ))}
          </div>
          <p className="label mt-3 !text-ink-40">
            Saved on this device. The printed journal starts at 5am.
          </p>
        </div>
      ) : null}

      <div className="relative border border-line">
      {/* The hours themselves, and the surface you press to start a block. */}
      <div
        ref={grid}
        onPointerDown={startDraw}
        className="relative cursor-crosshair"
        /*
         * pan-y lets a finger scroll the page through the grid. Blocking every
         * gesture here trapped the scroll on a phone, since the schedule is
         * tall enough to fill the screen. Drawing a block with a pointer still
         * works, because that gesture starts with a press rather than a drag.
         */
        style={{ touchAction: 'pan-y' }}
      >
        {hours.map((hour) => (
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
            className="border-accent-ink/40 bg-accent-soft"
            style={{ pointerEvents: 'none' }}
          />
        ) : null}

        {sorted.map((block, i) => (
          <Block key={`${block.start}-${i}`} block={block} className="border-accent-ink bg-accent-soft">
            <input
              ref={focusOn === block.start ? justCreated : null}
              value={block.label}
              onChange={(e) => update(i, { label: e.target.value })}
              onBlur={() => {
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
              aria-valuemax={SCHEDULE_LENGTH - block.start}
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
