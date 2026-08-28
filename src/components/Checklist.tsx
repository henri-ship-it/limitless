'use client'

import Link from 'next/link'
import { useOptimistic, useTransition } from 'react'
import { toggleChecklistItem } from '@/app/actions'
import type { ChecklistItem } from '@/content/checklist'
import { assets } from '@/content/assets'
import { DriveEmbed } from './DriveEmbed'
import { TickIcon } from './icons'

/**
 * The set up list on the Start Guide. Ticks are saved per member.
 *
 * The tick is its own control rather than the whole row, so an item can carry a
 * link beside it without nesting one control inside another.
 */
export function Checklist({
  items,
  completed,
}: {
  items: ChecklistItem[]
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
      {items.map((item) => {
        const checked = done.has(item.key)
        const asset = item.asset ? assets[item.asset] : null
        const link = item.link ?? (asset?.url ? { label: 'Watch the recording', href: asset.url } : null)

        return (
          <li key={item.key} className="!mb-0 flex items-start gap-4 border-b border-line py-4">
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  setDone(item.key)
                  await toggleChecklistItem(item.key, !checked)
                })
              }
              aria-pressed={checked}
              aria-label={item.label}
              className="mt-0.5 shrink-0"
            >
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  checked
                    ? 'border-accent-ink bg-accent-ink text-white'
                    : 'border-line-strong bg-surface text-transparent hover:border-ink'
                }`}
              >
                <TickIcon />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`!mb-0 text-[0.9375rem] ${
                  checked ? 'text-ink-56 line-through' : 'text-ink'
                }`}
              >
                {item.label}
              </p>
              {item.detail ? (
                <p className="!mb-0 mt-1 text-[0.8125rem] leading-relaxed text-ink-56">
                  {item.detail}
                </p>
              ) : null}
              {asset?.url ? (
                <div className="mt-3 w-full">
                  <DriveEmbed url={asset.url} title={item.label} />
                </div>
              ) : link ? (
                <Link
                  href={link.href}
                  className="label mt-2 inline-flex !no-underline border border-line px-3 py-1.5 hover:border-ink hover:!text-ink"
                >
                  {link.label}
                </Link>
              ) : asset ? (
                <p className="label mt-2 !text-ink-40">Recording to follow</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
