'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
 * The cookie is written here rather than by a server action, which is what made
 * this slow. A click used to cost three trips to the server in a row: the
 * action, then the navigation, then a refresh, with the action calling
 * revalidatePath on the whole layout and throwing away every cached page in the
 * app on the way past.
 *
 * Nothing is lost by moving it. The cookie is not a permission and never was:
 * getMode checks isAdmin before it reads it, so a forged one still returns the
 * weekly programme. It records a preference about what to look at, which is the
 * same kind of thing as a theme, and the server decides what that preference is
 * allowed to mean.
 *
 * Both destinations are prefetched on mount, so the click itself is a
 * navigation that has already arrived.
 */
export function ProgrammeToggle({ mode }: { mode: Mode }) {
  const router = useRouter()
  // Shown immediately on click. The server confirms it on the next render.
  const [shown, setShown] = useState<Mode>(mode)

  useEffect(() => setShown(mode), [mode])

  useEffect(() => {
    router.prefetch('/')
    router.prefetch('/elite')
  }, [router])

  function pick(next: Mode) {
    if (next === shown) return
    setShown(next)
    document.cookie = `${MODE_COOKIE}=${next}; path=/; max-age=${MODE_MAX_AGE}; samesite=lax`
    router.push(next === 'elite' ? '/elite' : '/')
    // The pages either side of this read the cookie on the server, so the
    // router's own cache has to be dropped or the old programme is served back.
    router.refresh()
  }

  return (
    <div
      role="group"
      aria-label="Programme"
      className="flex items-center rounded-full border border-line p-0.5"
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
