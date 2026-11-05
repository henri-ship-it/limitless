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

type Spoke = { label: string; lines: number }

type Result = {
  recording?: { on?: string; title?: string }
  segments?: number
  distinctSpeakers?: number
  spoke?: Spoke[]
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

  async function run(method: 'POST' | 'PUT') {
    setWorking(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/pocket-check', { method })
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
        The call is collected on its own once a day. This fetches it now. If nothing is
        filed, ask who it heard: the answer is almost always that Pocket did not name the
        people on it.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run('POST')}
          disabled={working}
          className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-40"
        >
          {working ? 'Working…' : 'Fetch the latest call'}
        </button>
        <button
          type="button"
          onClick={() => run('PUT')}
          disabled={working}
          className="label hover:!text-ink disabled:opacity-40"
        >
          Who did it hear?
        </button>
      </div>

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

              {result.spoke?.length ? (
                <ul className="!list-none !pl-0 !mb-4">
                  {result.spoke.map((one) => (
                    <li key={one.label} className="flex gap-3 border-t border-line py-2">
                      <span className="text-[0.9375rem] !text-ink-72">{one.label}</span>
                      <span className="label !text-ink-40 ml-auto">{one.lines} lines</span>
                    </li>
                  ))}
                </ul>
              ) : null}

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
