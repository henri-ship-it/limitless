'use client'

import { useEffect, useRef, useState } from 'react'
import { MODE_COOKIE, MODE_MAX_AGE } from '@/lib/mode-cookie'
import { TIERS, modeFor, tierInfo, type Tier } from '@/content/programme'
import { ChevronIcon, TickIcon } from './icons'

/**
 * Which product an admin is looking at.
 *
 * This replaced a pill with two halves, 16wk and Elite, and the reason is that
 * the pill was answering a question that stopped having two answers. Five
 * products now sit on two journals, so a control with one segment per product
 * would be five segments and about two hundred and fifty pixels of a header bar
 * that already carries a menu, a streak and an account icon.
 *
 * So it reads out rather than laying out: the product you are in, in words,
 * and the rest behind it grouped by journal. The grouping is the part worth
 * keeping. Three of the five draw the same three hundred and thirty six
 * entries, and an admin checking a chapter needs to know that two of their
 * choices will look identical before they pick one, not after.
 *
 * The cookie is written here rather than by a server action. That used to cost
 * three trips to the server for one click, the first of them calling
 * revalidatePath on the whole layout and dropping every cached page in the app
 * on its way past. Nothing is lost by moving it, because the cookie is not a
 * permission: viewingAs checks isAdmin before it reads it, so a forged one
 * still returns the reader's own product.
 *
 * The navigation that follows is a real one, not a client side push, and both
 * of the two attempts that came before it explain why. A soft push never
 * arrived, and prefetching the destinations was worse than useless: a prefetch
 * is rendered under the cookie in force at the time. Every page on the platform
 * reads this cookie on the server, so the only correct thing to serve after it
 * changes is a fresh render of everything.
 */
export function ViewAs({ viewing }: { viewing: Tier }) {
  const [open, setOpen] = useState(false)
  // Held so the control dims on click rather than after the page has loaded.
  const [going, setGoing] = useState<Tier | null>(null)
  const menu = useRef<HTMLDivElement>(null)
  const shown = tierInfo(going ?? viewing)

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

  function pick(next: Tier) {
    if (going) return
    setOpen(false)
    if (next === viewing) return
    setGoing(next)
    document.cookie = `${MODE_COOKIE}=${next}; path=/; max-age=${MODE_MAX_AGE}; samesite=lax`
    window.location.assign(modeFor(next) === 'elite' ? '/elite' : '/')
  }

  /*
   * Grouped by journal, in the order the products are sold. Built from TIERS
   * rather than written out, so a sixth product appears here by being added
   * there once.
   */
  const groups = [
    { mode: 'limitless' as const, heading: 'Sixteen weeks' },
    { mode: 'elite' as const, heading: 'Year long' },
  ]

  return (
    <div className="relative" ref={menu}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Viewing the platform as ${shown.label}`}
        title={shown.summary}
        className={`flex items-center gap-1.5 rounded-full border border-line py-1 pr-2 pl-1 transition-opacity ${
          going ? 'opacity-60' : ''
        }`}
      >
        <span className="tier-tag" data-tier={shown.key}>
          {shown.label}
        </span>
        <ChevronIcon
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open ? (
        <div
          /*
           * Pinned to the right edge rather than the left. This control sits a
           * few pixels from the corner of the window, so a menu anchored the
           * usual way ran straight off it.
           */
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[17rem] border border-line bg-surface shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]"
        >
          <p className="label border-b border-line px-3 py-2">Viewing as</p>

          {groups.map((group) => (
            <div key={group.mode} className="border-b border-line last:border-b-0">
              <p className="label !text-ink-40 px-3 pt-2.5 pb-1">{group.heading}</p>
              <ul className="pb-1.5">
                {TIERS.filter((t) => t.mode === group.mode).map((t) => (
                  <li key={t.key}>
                    <button
                      type="button"
                      onClick={() => pick(t.key)}
                      aria-current={t.key === viewing}
                      className="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-ink-3"
                    >
                      {/*
                        * The tick keeps its width whether or not it is drawn,
                        * so the five labels line up rather than the current one
                        * sitting proud of the other four.
                        */}
                      <span className="mt-0.5 w-3.5 shrink-0">
                        {t.key === viewing ? <TickIcon className="!text-accent" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.875rem] font-medium">{t.label}</span>
                        <span className="block text-[0.8125rem] leading-snug text-ink-56">
                          {t.summary}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
