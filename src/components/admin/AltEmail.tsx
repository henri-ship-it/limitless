'use client'

import { useState, useTransition } from 'react'
import { setAltEmail } from '@/app/actions'

/**
 * The other address this member answers scorecards from.
 *
 * Only needed when somebody fills one in from an address they did not enrol
 * with, which the webhook cannot work out on its own. Setting it here means the
 * next one lands by itself rather than being imported by hand.
 */
export function AltEmail({ memberId, current }: { memberId: string; current: string | null }) {
  const [value, setValue] = useState(current ?? '')
  const [saved, setSaved] = useState(false)
  const [problem, setProblem] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setSaved(false)
            setProblem('')
          }}
          placeholder="Another address they answer from"
          className="w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink"
        />
        <button
          type="button"
          disabled={pending || value === (current ?? '')}
          onClick={() =>
            startTransition(async () => {
              const result = await setAltEmail(memberId, value)
              if (result.error) setProblem(result.error)
              else setSaved(true)
            })
          }
          className="label shrink-0 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-40"
        >
          {pending ? 'Saving' : saved ? 'Saved' : 'Save'}
        </button>
      </div>
      <p className="mt-3 !mb-0 !text-ink-56 text-[0.8125rem]">
        {problem ? (
          <span className="!text-ink">{problem}</span>
        ) : (
          'A scorecard completed from this address is filed against them too.'
        )}
      </p>
    </div>
  )
}
