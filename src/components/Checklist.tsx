'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleChecklistItem } from '@/app/actions'
import { TickIcon } from './icons'
import type { ChecklistItem } from '@/content/checklist'

export function Checklist({
  items,
  completed,
}: {
  items: ChecklistItem[]
  completed: string[]
}) {
  const [, startTransition] = useTransition()
  const [done, setDone] = useOptimistic(
    new Set(completed),
    (state: Set<string>, key: string) => {
      const next = new Set(state)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    },
  )

  return (
    <ul className="!list-none !pl-0 divide-y divide-line border-y border-line">
      {items.map((item) => {
        const checked = done.has(item.key)
        return (
          <li key={item.key}>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setDone(item.key)
                  await toggleChecklistItem(item.key, !checked)
                })
              }
              aria-pressed={checked}
              className="flex w-full items-start gap-4 px-1 py-4 text-left hover:bg-ink-3"
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  checked
                    ? 'border-accent bg-accent text-white'
                    : 'border-line-strong bg-surface text-transparent'
                }`}
              >
                <TickIcon />
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[0.9375rem] ${
                    checked ? 'text-ink-56 line-through' : 'text-ink'
                  }`}
                >
                  {item.label}
                </span>
                {item.detail ? (
                  <span className="mt-1 block text-[0.8125rem] leading-relaxed text-ink-56">
                    {item.detail}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
