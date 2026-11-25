'use client'

import { useState, useTransition } from 'react'

import { setConsent } from '@/app/actions'
import {
  CONSENT_BODY,
  CONSENT_CHOICES,
  CONSENT_FOOTNOTE,
  CONSENT_TITLE,
  type ConsentChoice,
} from '@/content/consent'

/**
 * The permission question, asked once.
 *
 * Over the page rather than beside it, because this is the one thing on the
 * platform that should not be scrolled past: it is a decision somebody is
 * making about their own words, and a dismissable corner card would be
 * collecting consent by attrition.
 *
 * There is no close button and no default. Every one of the three answers
 * including no is a single tap that finishes the question for good, so the
 * only way to spend more than ten seconds on it is to want to.
 */
export function Consent({ firstName }: { firstName: string | null }) {
  const [chosen, setChosen] = useState<ConsentChoice | null>(null)
  const [saving, startSaving] = useTransition()

  function answer(choice: ConsentChoice) {
    setChosen(choice)
    startSaving(async () => {
      await setConsent(choice)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-10 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={CONSENT_TITLE}
        className="w-full max-w-lg border border-line bg-surface p-6 sm:p-9"
      >
        <h1 className="font-caption text-[2rem] leading-[0.95] font-bold tracking-[-0.01em] uppercase">
          {firstName ? `${firstName}, can we quote you?` : CONSENT_TITLE}
        </h1>

        <div className="mt-5 space-y-3.5">
          {CONSENT_BODY.map((paragraph) => (
            <p key={paragraph} className="text-[0.9375rem] leading-relaxed text-ink-72">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-7 space-y-2.5">
          {CONSENT_CHOICES.map((choice) => (
            <button
              key={choice.value}
              type="button"
              disabled={saving}
              onClick={() => answer(choice.value)}
              className={`w-full border p-4 text-left transition-colors ${
                chosen === choice.value
                  ? 'border-accent bg-accent-soft'
                  : 'border-line hover:border-line-strong'
              } disabled:opacity-60`}
            >
              <span className="block text-[0.9375rem] font-medium text-ink">{choice.label}</span>
              <span className="mt-1 block text-[0.8125rem] leading-relaxed text-ink-56">
                {choice.detail}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-[0.8125rem] leading-relaxed text-ink-40">{CONSENT_FOOTNOTE}</p>
      </div>
    </div>
  )
}
