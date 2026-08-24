'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleWeek } from '@/app/actions'
import { TickIcon } from './icons'

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
      className={`label flex items-center gap-2 border px-4 py-2.5 transition-colors ${
        checked
          ? 'border-accent bg-accent-soft !text-accent'
          : 'border-line bg-surface hover:border-ink hover:!text-ink'
      }`}
    >
      {checked ? (
        <>
          <TickIcon /> Week complete
        </>
      ) : (
        'Mark week complete'
      )}
    </button>
  )
}
