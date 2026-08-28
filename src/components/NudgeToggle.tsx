'use client'

import { useOptimistic, useTransition } from 'react'
import { setNudgePreference } from '@/app/actions'
import { TickIcon } from './icons'

/**
 * Turns off having your own writing inform what you are sent.
 *
 * On by default, because the nudges are part of how the programme keeps people
 * going. Off is one tap, and nothing else about membership changes.
 */
export function NudgeToggle({ enabled }: { enabled: boolean }) {
  const [, startTransition] = useTransition()
  const [on, setOn] = useOptimistic(enabled, (_: boolean, next: boolean) => next)

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setOn(!on)
          await setNudgePreference(!on)
        })
      }
      aria-pressed={on}
      className="flex w-full items-start gap-4 border border-line p-4 text-left hover:bg-ink-3"
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
          on
            ? 'border-accent-ink bg-accent-ink text-white'
            : 'border-line-strong bg-surface text-transparent'
        }`}
      >
        <TickIcon />
      </span>
      <span>
        <span className="block text-[0.9375rem] text-ink">
          Let my journal shape what I am sent
        </span>
        <span className="mt-1 block text-[0.8125rem] leading-relaxed text-ink-56">
          {on
            ? 'On. What you write may shape the emails, reminders and prompts you receive.'
            : 'Off. You will still get the weekly digests, and nothing else changes.'}
        </span>
      </span>
    </button>
  )
}
