'use client'

import { useState } from 'react'
import { STYLES } from '@/content/know-thyself'

/**
 * The four styles: the shape, and the order.
 *
 * The figure is the one the journal prints, so somebody with the book open
 * beside the screen is looking at the same thing twice. What it is not is a
 * way of reading which style is theirs. Most people come out fairly even, and
 * on a four point diagonal a seventeen point lead is about twenty pixels of
 * radius: the outline reads as a slightly lopsided square, and the eye cannot
 * rank four directions at once anyway.
 *
 * So the ranking is said in words and drawn as bars beside it, where the gaps
 * are on one axis and legible, and the figure is left to do the thing it is
 * good at: showing the overall spread, wide and even against long and spiked.
 *
 * Where the top two are within a few points, saying somebody leads with one of
 * them would be inventing a difference that is not there, so it says that
 * instead.
 */

const R = 124
const C = 172
const RINGS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

/** Inside this, first and second are not meaningfully apart. */
const TOO_CLOSE = 5

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
  /*
   * Two states rather than one. Hovering is a look, clicking is a decision, and
   * a look must not undo a decision: reading the panel means moving the pointer
   * off whatever you clicked, and a single state sent it straight back to the
   * lead the moment you did.
   *
   * So a hover shows on top of a pin, and letting go of the hover falls back to
   * the pin rather than to the beginning.
   */
  const [pinned, setPinned] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const chosen = hovered ?? pinned
  const shown = STYLES.find((s) => s.name === (chosen ?? lead)) ?? STYLES[0]

  const scored = STYLES.map((style) => ({
    style,
    score: Number.isFinite(scores[style.name]) ? scores[style.name] : 0,
  }))
  const has = scored.some((row) => row.score > 0)
  const ranked = [...scored].sort((a, b) => b.score - a.score)
  const close = has && ranked[0].score - ranked[1].score <= TOO_CLOSE

  const outline = ORDER.map((key) => {
    const row = scored.find((r) => r.style.key === key)
    const p = point(key, row?.score ?? 0)
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')

  return (
    <div className={className} onMouseLeave={() => setHovered(null)}>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
        <div className="relative mx-auto w-full max-w-[20rem]">
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
                  {on ? <circle cx={p.x} cy={p.y} r="11" fill="var(--color-accent-soft)" /> : null}
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
            * Anchored to the corners of the square rather than measured along
            * the diagonal. The circle fills most of the box, so anything placed
            * by angle lands on top of the outer rings; the corners are the only
            * space the figure leaves free, and where the printed page puts them.
            */}
          {STYLES.map((style) => {
            const dir = DIRECTION[style.key]
            const on = style.name === shown.name
            return (
              <button
                key={style.key}
                type="button"
                onMouseEnter={() => setHovered(style.name)}
                onFocus={() => setHovered(style.name)}
                onClick={() => setPinned(style.name)}
                aria-pressed={on}
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
              </button>
            )
          })}
        </div>

        <div>
          {has ? (
            <p className="!mb-5 text-[1.0625rem] leading-relaxed text-ink">
              {close ? (
                <>
                  You sit almost level between the{' '}
                  <strong className="font-medium">{ranked[0].style.name}</strong> and the{' '}
                  <strong className="font-medium">{ranked[1].style.name}</strong>, so read both.
                </>
              ) : (
                <>
                  You lead with the{' '}
                  <strong className="font-medium">{ranked[0].style.name}</strong>, ahead of the{' '}
                  {ranked[1].style.name} by {Math.round(ranked[0].score - ranked[1].score)}.
                </>
              )}
            </p>
          ) : null}

          {/*
            * The list markers and indent are turned off here rather than left
            * to the page. This sits inside the digest's prose styling on one
            * page and outside it on another, and a row that is a button with
            * an icon has no use for a bullet in either.
            */}
          <ul className="!mb-0 !list-none !pl-0 flex flex-col gap-1">
            {(has ? ranked : scored).map(({ style, score }, i) => {
              /*
                * Only ever the row somebody picked. Marking the lead as well
                * said the same thing twice, and the Yours pill says it better.
                */
              const on = style.name === chosen
              const yours = has && (i === 0 || (close && i === 1))
              return (
                <li key={style.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(style.name)}
                    onFocus={() => setHovered(style.name)}
                    onClick={() => setPinned(style.name)}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${
                      on ? 'bg-ink-3' : 'hover:bg-ink-3'
                    }`}
                  >
                    <img
                      src={style.icon}
                      alt=""
                      width={20}
                      height={20}
                      className={`h-5 w-5 shrink-0 object-contain ${on || yours ? '' : 'opacity-40'}`}
                    />
                    <span
                      className={`w-24 shrink-0 text-[0.9375rem] ${on || yours ? 'font-medium text-ink' : 'text-ink-72'}`}
                    >
                      {style.name}
                    </span>

                    {/*
                      * The gaps on one axis, where four points apart is four
                      * points apart rather than a barely tilted corner.
                      */}
                    <span className="h-1.5 min-w-0 flex-1 rounded-full bg-ink-8">
                      <span
                        className="block h-1.5 rounded-full bg-accent"
                        style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
                      />
                    </span>

                    <span
                      className={`w-8 shrink-0 text-right text-[1rem] tabular-nums ${
                        yours ? 'font-medium text-ink' : 'text-ink-56'
                      }`}
                    >
                      {Math.round(score)}
                    </span>
                    {/*
                      * Always present, so every bar is drawn on a track of the
                      * same width. Rendered only on the rows that need it, the
                      * marked row lost the pill's width from its own track and
                      * a sixty-seven came out no longer than a fifty.
                      */}
                    <span className="w-14 shrink-0 text-right">
                      {yours ? <span className="pill !text-accent-ink">Yours</span> : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <div className="!mb-4 flex items-center gap-3">
          <img
            src={shown.icon}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          <div>
            <p className="!mb-0 text-[1.0625rem] font-medium text-ink">The {shown.name}</p>
            <p className="!mb-0 text-[0.9375rem] !text-ink-56">{shown.overview}</p>
          </div>
        </div>

        <dl className="!mb-0 grid gap-4 sm:grid-cols-3">
          <Field label="Differentiator" text={shown.differentiator} />
          <Field label="Blindspot" text={shown.blindspot} />
          <Field label="Bottleneck" text={shown.bottleneck} />
        </dl>

        <p className="mt-5 !mb-0 text-[0.8125rem] !text-ink-40">
          Hover a style to read it. Click one to keep it there.
        </p>
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
