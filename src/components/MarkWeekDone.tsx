'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleWeek } from '@/app/actions'

export function MarkWeekDone({ week, done }: { week: number; done: boolean }) {
  const [, startTransition] = useTransition()
  const [checked, setChecked] = useOptimistic(done, (v: boolean) => !v)

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setChecked(true)
          await toggleWeek(week, !checked)
        })
      }
      aria-pressed={checked}
      className={`label border px-4 py-2.5 transition-colors ${
        checked
          ? 'border-accent bg-accent-soft !text-accent'
          : 'border-line bg-surface hover:!text-ink hover:border-ink'
      }`}
    >
      {checked ? '✓ Week complete' : 'Mark week complete'}
    </button>
  )
}
