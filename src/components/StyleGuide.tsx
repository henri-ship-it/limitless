'use client'

import { useState } from 'react'
import { STYLES, type Style } from '@/content/know-thyself'

/**
 * The four behavioural styles, each openable for what it costs and what it wins.
 *
 * Folded shut by default and on purpose. Four cards of four fields is a wall of
 * text, and most of the time somebody is here to look at one style: their own,
 * or the one belonging to whoever they are struggling with. Open is a choice.
 *
 * `lead` is the style the reader came out as, which is opened to begin with and
 * marked, since on their own pages that is the one they are looking for.
 */
export function StyleGuide({
  scores,
  lead,
  className = '',
}: {
  /** When given, each card carries the reader's own score for that style. */
  scores?: Record<string, number>
  lead?: string
  className?: string
}) {
  const [open, setOpen] = useState<string | null>(lead ?? null)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {STYLES.map((style) => (
        <Card
          key={style.key}
          style={style}
          score={scores?.[style.name]}
          yours={style.name === lead}
          open={open === style.name}
          onToggle={() => setOpen((was) => (was === style.name ? null : style.name))}
        />
      ))}
    </div>
  )
}

function Card({
  style,
  score,
  yours,
  open,
  onToggle,
}: {
  style: Style
  score?: number
  yours: boolean
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className={`border ${open ? 'border-line-strong' : 'border-line'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-ink-3"
      >
        <img
          src={style.icon}
          alt=""
          width={28}
          height={28}
          className={`h-7 w-7 shrink-0 object-contain ${open || yours ? '' : 'opacity-40'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[1rem] font-medium text-ink">
            The {style.name}
            {yours ? <span className="label !text-accent-ink ml-2">Yours</span> : null}
          </span>
          <span className="block text-[0.875rem] !text-ink-56">{style.overview}</span>
        </span>
        {Number.isFinite(score) ? (
          <span
            className="text-[1.25rem] leading-none font-medium"
            style={yours ? { color: 'var(--color-accent-ink)' } : undefined}
          >
            {Math.round(score as number)}
          </span>
        ) : null}
        <span
          className={`label shrink-0 !text-ink-40 ${open ? 'rotate-180' : ''} transition-transform`}
          aria-hidden
        >
          ⌄
        </span>
      </button>

      {open ? (
        <dl className="grid gap-4 border-t border-line p-4 sm:grid-cols-3">
          <Field label="Differentiator" text={style.differentiator} />
          <Field label="Blindspot" text={style.blindspot} />
          <Field label="Bottleneck" text={style.bottleneck} />
        </dl>
      ) : null}
    </div>
  )
}

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="label !mb-1.5">{label}</dt>
      <dd className="!mb-0 text-[0.9375rem] leading-relaxed text-ink-72">{text}</dd>
    </div>
  )
}
