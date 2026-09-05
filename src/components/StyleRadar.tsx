'use client'

import { useState } from 'react'
import { STYLES, type Style } from '@/content/know-thyself'

/**
 * The four styles as the journal draws them.
 *
 * Same figure as the printed page: four diagonal axes, rings every ten to a
 * hundred, Dynamo and Analyst on the right, Energiser and Caretaker on the
 * left. Somebody who has the journal open beside the screen should be looking
 * at one shape, not two.
 *
 * The scores are a shape rather than four numbers because the shape is the
 * point. A wide even pentagon and a long spike in one direction are different
 * people, and a list of four figures hides that.
 *
 * Hovering a corner brings that style forward and tells you what it wins and
 * what it costs. Hover is not available on a phone, so a tap does the same
 * thing, and the reader's own style is what is showing before anybody touches
 * anything.
 */

const R = 124
const C = 172
const RINGS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

/** Where each style sits, as a unit vector. SVG's y runs downwards. */
const DIRECTION: Record<string, { x: number; y: number }> = {
  dynamo: { x: 0.7071, y: -0.7071 },
  energiser: { x: -0.7071, y: -0.7071 },
  caretaker: { x: -0.7071, y: 0.7071 },
  analyst: { x: 0.7071, y: 0.7071 },
}

/** Clockwise from the top right, so the outline never crosses itself. */
const ORDER = ['dynamo', 'analyst', 'caretaker', 'energiser']

function point(key: string, score: number) {
  const dir = DIRECTION[key]
  const r = (Math.max(0, Math.min(100, score)) / 100) * R
  return { x: C + dir.x * r, y: C + dir.y * r }
}

export function StyleRadar({
  scores,
  lead,
  className = '',
}: {
  scores: Record<string, number>
  /** The style they came out as, shown before anything is hovered. */
  lead?: string
  className?: string
}) {
  const [active, setActive] = useState<string | null>(null)
  const shown = STYLES.find((s) => s.name === (active ?? lead)) ?? STYLES[0]

  const scored = STYLES.map((style) => ({
    style,
    score: Number.isFinite(scores[style.name]) ? scores[style.name] : 0,
  }))
  const has = scored.some((row) => row.score > 0)

  const outline = ORDER.map((key) => {
    const row = scored.find((r) => r.style.key === key)
    const p = point(key, row?.score ?? 0)
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')

  return (
    <div className={className}>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
        <div className="relative mx-auto w-full max-w-[22rem]">
          <svg viewBox="0 0 344 344" className="w-full" role="img" aria-label="Your four scores">
            {RINGS.map((ring) => (
              <circle
                key={ring}
                cx={C}
                cy={C}
                r={(ring / 100) * R}
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="1"
              />
            ))}

            {/* The upright cross the printed page draws behind the diagonals. */}
            <line x1={C - R - 14} y1={C} x2={C + R + 14} y2={C} stroke="var(--color-line)" />
            <line x1={C} y1={C - R - 14} x2={C} y2={C + R + 14} stroke="var(--color-line)" />

            {STYLES.map((style) => {
              const dir = DIRECTION[style.key]
              return (
                <line
                  key={style.key}
                  x1={C}
                  y1={C}
                  x2={C + dir.x * R}
                  y2={C + dir.y * R}
                  stroke="var(--color-line)"
                  strokeDasharray="2 4"
                />
              )
            })}

            {has ? (
              <polygon
                points={outline}
                fill="var(--color-accent-soft)"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            ) : null}

            {scored.map(({ style, score }) => {
              const p = point(style.key, score)
              const on = style.name === shown.name
              return (
                <g key={style.key}>
                  {on ? (
                    <circle cx={p.x} cy={p.y} r="11" fill="var(--color-accent-soft)" />
                  ) : null}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={on ? 6 : 4.5}
                    fill={on ? 'var(--color-ink)' : 'var(--color-accent)'}
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                  />
                </g>
              )
            })}
          </svg>

          {/*
            * Set in HTML over the figure rather than as SVG text, so a corner
            * is a real button: focusable, tappable, and the same pill used
            * everywhere else on the platform.
            */}
          {STYLES.map((style) => {
            const dir = DIRECTION[style.key]
            const on = style.name === shown.name
            return (
              <button
                key={style.key}
                type="button"
                onMouseEnter={() => setActive(style.name)}
                onFocus={() => setActive(style.name)}
                onClick={() => setActive(style.name)}
                aria-pressed={on}
                /*
                  * Anchored to the corners of the square rather than measured
                  * along the diagonal. The circle fills most of the box, so
                  * anything placed by angle lands on top of the outer rings;
                  * the corners are the only space the figure leaves free, and
                  * they are where the printed page puts them.
                  */
                className={`pill absolute flex items-center gap-1.5 ${
                  on ? '!border-accent !bg-accent-soft !text-ink' : 'bg-surface hover:!text-ink'
                }`}
                style={{
                  [dir.x < 0 ? 'left' : 'right']: 0,
                  [dir.y < 0 ? 'top' : 'bottom']: 0,
                }}
              >
                <img
                  src={style.icon}
                  alt=""
                  width={14}
                  height={14}
                  className={`h-3.5 w-3.5 object-contain ${on ? '' : 'opacity-40'}`}
                />
                {style.name}
                <span className={on ? '!text-ink' : '!text-ink-40'}>
                  {Math.round(scores[style.name] ?? 0)}
                </span>
              </button>
            )
          })}
        </div>

        <div onMouseLeave={() => setActive(null)}>
          <div className="!mb-4 flex items-center gap-3">
            <img
              src={shown.icon}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div>
              <p className="!mb-0 text-[1.125rem] font-medium text-ink">The {shown.name}</p>
              <p className="!mb-0 text-[0.9375rem] !text-ink-56">{shown.overview}</p>
            </div>
          </div>

          <dl className="!mb-0 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
            <Field label="Differentiator" text={shown.differentiator} />
            <Field label="Blindspot" text={shown.blindspot} />
            <Field label="Bottleneck" text={shown.bottleneck} />
          </dl>

          <p className="mt-5 !mb-0 text-[0.8125rem] !text-ink-40">
            Hover a corner, or tap one, to read another.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="label !mb-1">{label}</dt>
      <dd className="!mb-0 text-[0.9375rem] leading-relaxed text-ink-72">{text}</dd>
    </div>
  )
}
