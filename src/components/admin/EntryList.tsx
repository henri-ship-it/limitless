'use client'

import { useState, type ReactNode } from 'react'

export type EntryItem = {
  n: number
  week: number
  title: string
  when: string
  /** Rendered on the server, so the answer formatting stays in one place. */
  body: ReactNode
}

/**
 * Somebody's journal, newest first and shut.
 *
 * A hundred and twelve entries laid open ran to a page nobody scrolled to the
 * end of, and the one that matters is almost always the last one written. So
 * the newest is open, the rest are a list of titles, and the order can be
 * turned around for the times you want to read someone from the beginning.
 */
export function EntryList({ items }: { items: EntryItem[] }) {
  const [oldestFirst, setOldestFirst] = useState(false)
  const ordered = oldestFirst ? [...items].reverse() : items
  const [open, setOpen] = useState<number[]>(items.length ? [items[0].n] : [])

  return (
    <div>
      <div className="!mb-5 flex flex-wrap items-center gap-1.5">
        {(
          [
            { key: false, label: 'Newest first' },
            { key: true, label: 'Oldest first' },
          ] as const
        ).map((option) => (
          <button
            key={String(option.key)}
            type="button"
            onClick={() => setOldestFirst(option.key)}
            aria-pressed={oldestFirst === option.key}
            className={`pill ${
              oldestFirst === option.key
                ? '!border-accent-ink !bg-accent-soft !text-ink'
                : 'hover:!border-line-strong hover:!text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(open.length ? [] : items.map((item) => item.n))}
          className="label ml-auto !text-ink-40 hover:!text-ink"
        >
          {open.length ? 'Close all' : 'Open all'}
        </button>
      </div>

      <div className="border-t border-line">
        {ordered.map((item) => {
          const isOpen = open.includes(item.n)
          return (
            <div key={item.n} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((was) =>
                    was.includes(item.n) ? was.filter((n) => n !== item.n) : [...was, item.n],
                  )
                }
                className="flex w-full items-center gap-3 py-3.5 text-left hover:bg-ink-3"
              >
                <span className="pill shrink-0">{item.n}</span>
                <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-ink">
                  {item.title}
                </span>
                {item.week ? <span className="label hidden sm:block">Week {item.week}</span> : null}
                <span className="label !text-ink-40 shrink-0">{item.when}</span>
                <span
                  className={`label !text-ink-40 shrink-0 ${isOpen ? 'rotate-180' : ''} transition-transform`}
                  aria-hidden
                >
                  ⌄
                </span>
              </button>
              {isOpen ? <div className="pb-6">{item.body}</div> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
