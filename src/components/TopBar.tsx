'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { modules, weeks, type Tier } from '@/content/programme'
import { ChevronIcon, LockIcon, NowIndicator, TickIcon } from './icons'

type Props = {
  /** The wordmark returns a member to whatever they were last working on. */
  resumeHref: string
  tier: Tier
  currentWeek: number
  openThrough: number
  isAdmin: boolean
  completedWeeks: number[]
}

export function TopBar({
  resumeHref,
  tier,
  isAdmin,
  currentWeek,
  openThrough,
  completedWeeks,
}: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menu = useRef<HTMLDivElement>(null)
  const done = new Set(completedWeeks)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    function onClick(event: MouseEvent) {
      if (!menu.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="flex h-14 items-center gap-6 px-5">
        <Link
          href={resumeHref}
          className="font-mono text-[0.8125rem] font-medium tracking-[0.16em] uppercase"
        >
          Limitless
        </Link>

        <div className="relative" ref={menu}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="label flex items-center gap-1.5 rounded-full border border-line bg-ink-3 px-3 py-1.5 hover:!text-ink"
          >
            Programme
            <ChevronIcon className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>

          {open ? (
            <div /*
               * Anchored under the button on a wide screen. On a phone it
               * spans the viewport instead, because anchoring it to a button
               * two thirds of the way across ran it off the right edge.
               */
              className="fixed inset-x-2 top-[3.5rem] z-50 max-h-[calc(100vh-4.5rem)] overflow-y-auto overscroll-contain border border-line bg-surface shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] sm:absolute sm:inset-x-auto sm:left-0 sm:top-[calc(100%+0.5rem)] sm:max-h-[calc(100vh-5rem)] sm:w-[min(92vw,42rem)]">
              <div className="sticky top-0 z-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-line bg-surface px-4 py-3">
                <Link href="/" onClick={() => setOpen(false)} className="label hover:!text-ink">
                  Start Guide
                </Link>
                <Link href="/journal" onClick={() => setOpen(false)} className="label hover:!text-ink">
                  Journal
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="tier-tag !no-underline ml-auto"
                    data-tier="admin"
                  >
                    Admin
                  </Link>
                ) : tier === 'pro' ? (
                  <Link
                    href="/pro"
                    onClick={() => setOpen(false)}
                    className="tier-tag !no-underline ml-auto"
                    data-tier="pro"
                  >
                    Pro
                  </Link>
                ) : (
                  <span className="tier-tag ml-auto" data-tier="core">
                    Core
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-2">
                {modules.map((m) => (
                  <div key={m.number} className="border-b border-line p-4 sm:[&:nth-child(2n)]:border-l">
                    <p className="label mb-1">
                      Module {String(m.number).padStart(2, '0')}
                    </p>
                    <p className="mb-3 text-[0.9375rem] font-medium">{m.name}</p>
                    <ul className="space-y-0.5">
                      {m.weeks.map((n) => {
                        const week = weeks.find((w) => w.number === n)!
                        const locked = n > openThrough
                        const inner = (
                          <span className="flex items-center justify-between gap-3 py-1">
                            <span className="flex min-w-0 items-baseline gap-2.5">
                              <span className="label w-4 shrink-0">{String(n).padStart(2, '0')}</span>
                              <span className="truncate text-[0.875rem]">{week.title}</span>
                            </span>
                            {done.has(n) ? (
                              <TickIcon className="shrink-0 text-accent-ink" />
                            ) : n === currentWeek ? (
                              <span className="radar shrink-0" aria-hidden />
                            ) : locked ? (
                              <LockIcon className="shrink-0 text-ink-20" />
                            ) : null}
                          </span>
                        )
                        return (
                          <li key={n}>
                            {locked ? (
                              <span className="block cursor-default text-ink-40">{inner}</span>
                            ) : (
                              <Link
                                href={`/week/${n}`}
                                onClick={() => setOpen(false)}
                                className="block text-ink-72 hover:text-ink"
                              >
                                {inner}
                              </Link>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/account"
            className="tier-tag !no-underline"
            data-tier={isAdmin ? 'admin' : tier}
            aria-label="Your account"
          >
            {isAdmin ? 'admin' : tier}
          </Link>
        </div>
      </div>
    </header>
  )
}
