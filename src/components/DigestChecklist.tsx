'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleChecklistItem } from '@/app/actions'
import { TickIcon } from './icons'

/**
 * The focus points for a week, as things to tick off rather than another
 * bulleted list. Ticks are saved against the member the same way the Start
 * Guide list is.
 */
export function DigestChecklist({
  keyPrefix,
  items,
  completed,
}: {
  keyPrefix: string
  items: string[]
  completed: string[]
}) {
  const [, startTransition] = useTransition()
  const [done, setDone] = useOptimistic(new Set(completed), (state: Set<string>, key: string) => {
    const next = new Set(state)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  return (
    <ul className="!list-none !pl-0 !mb-0 border-t border-line">
      {items.map((item, i) => {
        const key = `${keyPrefix}:${i}`
        const checked = done.has(key)
        return (
          <li key={i} className="!mb-0 border-b border-line">
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setDone(key)
                  await toggleChecklistItem(key, !checked)
                })
              }
              aria-pressed={checked}
              className="flex w-full items-start gap-3.5 py-3 text-left hover:bg-ink-3"
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[3px] border ${
                  checked
                    ? 'border-accent-ink bg-accent-ink text-white'
                    : 'border-line-strong bg-surface text-transparent'
                }`}
              >
                <TickIcon />
              </span>
              <span
                className={`text-[0.9375rem] leading-relaxed ${
                  checked ? 'text-ink-40 line-through' : 'text-ink-72'
                }`}
              >
                {item}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
