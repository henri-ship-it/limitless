'use client'

import { useOptimistic, useTransition } from 'react'

import { setConsent } from '@/app/actions'
import { CONSENT_CHOICES, type ConsentChoice as Choice } from '@/content/consent'

/**
 * Changing the answer to the quoting question, from the account page.
 *
 * The thing that makes an up-front permission defensible rather than a
 * formality is that it can be taken back in one tap, in the place somebody
 * would look for it. Without this the gate on the way in is just a form.
 */
export function ConsentChoice({ chosen }: { chosen: Choice | null }) {
  const [, startTransition] = useTransition()
  const [current, setCurrent] = useOptimistic(chosen, (_: Choice | null, next: Choice) => next)

  return (
    <div className="space-y-2.5" role="radiogroup" aria-label="Can we quote you">
      {CONSENT_CHOICES.map((choice) => {
        const on = current === choice.value
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() =>
              startTransition(async () => {
                setCurrent(choice.value)
                await setConsent(choice.value)
              })
            }
            className={`w-full border p-4 text-left transition-colors ${
              on ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'
            }`}
          >
            <span className="block text-[0.9375rem] font-medium text-ink">{choice.label}</span>
            <span className="mt-1 block text-[0.8125rem] leading-relaxed text-ink-56">
              {choice.detail}
            </span>
          </button>
        )
      })}
    </div>
  )
}
