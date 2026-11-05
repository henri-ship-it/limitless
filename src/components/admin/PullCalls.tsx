'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Fetches the week's call from the recorder, now rather than overnight.
 *
 * The scheduled job runs once a day, which is fine in the ordinary week and
 * useless on the day somebody wants to see whether this works at all. This
 * presses the same job by hand.
 *
 * What it reports matters more than what it files. A call that opened and then
 * filed nothing almost always means Pocket labelled somebody by a name that is
 * not on their profile, and nothing else in the product would ever say so.
 */

type Result = {
  ok?: boolean
  error?: string
  checked?: number
  skippedWithoutOpening?: number
  note?: string
  results?: { recordingId: string; filed: string[]; unmatched: string[]; ignored?: string }[]
}

export function PullCalls() {
  const router = useRouter()
  const [working, setWorking] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  async function pull() {
    setWorking(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/pocket-check', { method: 'POST' })
      const payload = (await response.json()) as Result
      setResult(payload)
      if (payload.results?.some((r) => r.filed.length)) router.refresh()
    } catch {
      setResult({ error: 'Could not reach the server.' })
    } finally {
      setWorking(false)
    }
  }

  const unmatched = [...new Set((result?.results ?? []).flatMap((r) => r.unmatched))]

  return (
    <div>
      <p className="!mb-4 text-[0.9375rem] !text-ink-56">
        The call is collected on its own once a day. This fetches it now.
      </p>

      <button
        type="button"
        onClick={pull}
        disabled={working}
        className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-40"
      >
        {working ? 'Fetching…' : 'Fetch the latest call'}
      </button>

      {result ? (
        <div className="mt-5 border-t border-line pt-5">
          {result.error ? (
            <p className="!mb-0 text-[0.9375rem] text-ink">{result.error}</p>
          ) : (
            <>
              <p className="!mb-3 text-[0.9375rem] !text-ink-72">{result.note}</p>

              {result.results?.map((one) => (
                <div key={one.recordingId} className="!mb-3">
                  {one.filed.length ? (
                    <p className="!mb-1 text-[0.9375rem] !text-ink-72">
                      Filed against {one.filed.join(', ')}.
                    </p>
                  ) : null}
                  {one.ignored ? (
                    <p className="!mb-1 text-[0.9375rem] !text-ink-56">{one.ignored}</p>
                  ) : null}
                </div>
              ))}

              {unmatched.length ? (
                <p className="!mb-0 text-[0.875rem] !text-ink-56">
                  Heard but not matched to anybody: {unmatched.join(', ')}. If one of those is a
                  member, put that exact name in their recording name and fetch again.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
