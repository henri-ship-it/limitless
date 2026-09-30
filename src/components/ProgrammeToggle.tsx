'use client'

import { useState } from 'react'
import { MODE_COOKIE, MODE_MAX_AGE } from '@/lib/mode-cookie'
import type { Mode } from '@/lib/programme-mode'

/**
 * Switches between the sixteen week programme and Elite.
 *
 * Built as one control with two halves rather than a button that says the other
 * thing, for the same reason a light and dark switch shows both: a toggle
 * labelled with where you are going tells you nothing about where you are, and
 * two programmes with overlapping chapter titles is exactly the situation where
 * that matters.
 *
 * The cookie is written here rather than by a server action. That used to cost
 * three trips to the server for one click, the first of them calling
 * revalidatePath on the whole layout and dropping every cached page in the app
 * on its way past. Nothing is lost by moving it, because the cookie is not a
 * permission: getMode checks isAdmin before it reads it, so a forged one still
 * returns the weekly programme.
 *
 * The navigation that follows is a real one, not a client side push, and both
 * of the two attempts that came before it explain why. A soft push never
 * arrived, and prefetching the two destinations was worse than useless: a
 * prefetch is rendered under the cookie in force at the time, so the copy of
 * /elite sitting in the router cache was the one built while the toggle still
 * said sixteen weeks. Every page on the platform reads this cookie on the
 * server, so the only correct thing to serve after it changes is a fresh
 * render of everything.
 */
export function ProgrammeToggle({ mode }: { mode: Mode }) {
  // Held so the button darkens on click rather than after the page has loaded.
  const [going, setGoing] = useState<Mode | null>(null)
  const shown = going ?? mode

  function pick(next: Mode) {
    if (next === mode || going) return
    setGoing(next)
    document.cookie = `${MODE_COOKIE}=${next}; path=/; max-age=${MODE_MAX_AGE}; samesite=lax`
    window.location.assign(next === 'elite' ? '/elite' : '/')
  }

  return (
    <div
      role="group"
      aria-label="Programme"
      className={`flex items-center rounded-full border border-line p-0.5 ${going ? 'opacity-60' : ''}`}
    >
      {(
        [
          { key: 'limitless' as const, label: '16wk', full: 'The sixteen week programme' },
          { key: 'elite' as const, label: 'Elite', full: 'Elite, the year long programme' },
        ]
      ).map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => pick(option.key)}
          aria-pressed={shown === option.key}
          title={option.full}
          className={`label rounded-full px-2.5 py-1 transition-colors ${
            shown === option.key ? 'bg-ink !text-white' : '!text-ink-40 hover:!text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
