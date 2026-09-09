'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { setProgrammeMode } from '@/app/actions'
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
 * Admin only, and the server checks that again when the cookie is set. Nothing
 * here is a permission.
 */
export function ProgrammeToggle({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function pick(next: Mode) {
    if (next === mode) return
    start(async () => {
      await setProgrammeMode(next)
      // The two programmes have different homes, so switching goes to one.
      router.push(next === 'elite' ? '/elite' : '/')
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label="Programme"
      className={`flex items-center rounded-full border border-line p-0.5 ${pending ? 'opacity-50' : ''}`}
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
          aria-pressed={mode === option.key}
          title={option.full}
          className={`label rounded-full px-2.5 py-1 ${
            mode === option.key ? 'bg-ink-8 !text-ink' : '!text-ink-40 hover:!text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
