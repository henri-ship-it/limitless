'use client'

import type { Field } from '@/content/entry-fields'
import { EntryText } from './EntryText'

type Value = string | string[]

type Props = {
  field: Field
  path: string
  value: Value | undefined
  onChange: (path: string, value: Value) => void
}

/** The black numbered disc the book uses to tie a step to its diagram. */
function Step({ n }: { n: number }) {
  return (
    <span className="mr-2.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[0.6875rem] text-white">
      {n}
    </span>
  )
}

function Label({ field }: { field: Field }) {
  if (field.kind === 'note' || field.kind === 'group') return null
  const step = 'step' in field ? field.step : undefined
  return (
    <p className="mb-2 flex items-start text-[0.9375rem] leading-relaxed text-ink">
      {step ? <Step n={step} /> : null}
      <span className={step ? 'pt-0.5' : undefined}><EntryText text={field.label} /></span>
    </p>
  )
}

const inputClass =
  'w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink'

export function EntryField({ field, path, value, onChange }: Props) {
  if (field.kind === 'note') {
    return <p className="text-[0.9375rem] leading-relaxed text-ink-72"><EntryText text={field.text} /></p>
  }

  if (field.kind === 'group') {
    return (
      <div>
        <p className="label mb-3">{field.label}</p>
        <div className="space-y-5 border-l border-line pl-5">
          {field.fields.map((child, i) => (
            <EntryField
              key={`${path}.${i}`}
              field={child}
              path={`${path}.${i}`}
              value={value}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    )
  }

  const single = typeof value === 'string' ? value : ''

  if (field.kind === 'line') {
    return (
      <div>
        <Label field={field} />
        <input value={single} onChange={(e) => onChange(path, e.target.value)} className={inputClass} />
      </div>
    )
  }

  if (field.kind === 'lines') {
    const list = Array.isArray(value) ? value : []
    return (
      <div>
        <Label field={field} />
        <div className="space-y-2">
          {Array.from({ length: field.count }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="label w-4 shrink-0">{i + 1}</span>
              <input
                value={list[i] ?? ''}
                onChange={(e) => {
                  const next = [...list]
                  next[i] = e.target.value
                  onChange(path, next)
                }}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (field.kind === 'percent') {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
        <span className="text-[0.9375rem] text-ink">{field.label}</span>
        <span className="flex items-center gap-1.5">
          <input
            inputMode="numeric"
            value={single}
            onChange={(e) => onChange(path, e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
            className="w-16 border border-line bg-surface px-2 py-1.5 text-right text-[0.9375rem] outline-none focus:border-ink"
          />
          <span className="label">%</span>
        </span>
      </div>
    )
  }

  if (field.kind === 'scale') {
    const picked = Number(single)
    return (
      <div>
        <Label field={field} />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(path, String(n))}
              aria-pressed={picked === n}
              className={`h-9 w-9 border font-mono text-[0.75rem] transition-colors ${
                picked === n
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-surface text-ink-56 hover:border-line-strong hover:text-ink'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (field.kind === 'gauge') {
    const score = single === '' ? 5 : Number(single)
    return (
      <div>
        <Label field={field} />
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={score}
            onChange={(e) => onChange(path, e.target.value)}
            className="h-1 w-full appearance-none rounded-full bg-ink-12 accent-[var(--color-ink)]"
          />
          <span className="label w-10 shrink-0 text-right">
            {single === '' ? '—' : `${score}/10`}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Label field={field} />
      <textarea
        rows={4}
        value={single}
        onChange={(e) => onChange(path, e.target.value)}
        className={`${inputClass} resize-y leading-relaxed`}
      />
    </div>
  )
}
