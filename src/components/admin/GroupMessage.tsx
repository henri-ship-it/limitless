'use client'

import { useState } from 'react'
import { assets } from '@/content/assets'
import { COHORT } from '@/content/programme'

type Moment = 'open' | 'close'

/**
 * The message that opens or closes a week in the Pro WhatsApp group.
 *
 * Deliberately generic. This one goes to everybody, so it works from the
 * chapter rather than from anybody's journal; what needs saying to one person
 * is said from their own profile, where the drafting can actually see them.
 */
export function GroupMessage({
  week,
  title,
  day,
  weeks,
}: {
  week: number
  title: string
  day: number
  weeks: number
}) {
  const [moment, setMoment] = useState<Moment>('open')
  const [intent, setIntent] = useState('')
  const [draft, setDraft] = useState('')
  const [angle, setAngle] = useState('')
  const [problem, setProblem] = useState('')
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)

  async function write() {
    setWorking(true)
    setProblem('')
    setCopied(false)
    try {
      const response = await fetch('/api/admin/group', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ moment, week, intent }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setProblem(payload.error ?? 'That did not work.')
        return
      }
      setDraft(payload.message ?? '')
      setAngle(payload.angle ?? '')
    } catch {
      setProblem('Could not reach the server.')
    } finally {
      setWorking(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="!mb-5 flex flex-wrap items-center gap-2">
        <span className="pill !text-ink">
          Week {String(week).padStart(2, '0')} of {weeks}
        </span>
        <span className="pill">{title}</span>
        {day > 0 ? <span className="pill">Day {day} of the week</span> : null}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(
          [
            { key: 'open' as const, label: 'Tee up the week' },
            { key: 'close' as const, label: 'Close the week' },
          ] satisfies { key: Moment; label: string }[]
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMoment(option.key)}
            aria-pressed={moment === option.key}
            className={`pill ${
              moment === option.key
                ? '!border-accent-ink !bg-accent-soft !text-ink'
                : 'hover:!border-line-strong hover:!text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="Anything to work in? A call, a nudge, a theme. Leave blank and it will decide."
          className="w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={write}
          disabled={working}
          className="label shrink-0 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-40"
        >
          {working ? 'Writing…' : draft ? 'Try again' : 'Draft for the group'}
        </button>
      </div>

      {problem ? <p className="mt-3 !mb-0 text-[0.875rem] text-ink">{problem}</p> : null}

      {draft ? (
        <div className="mt-5">
          {angle ? <p className="label !mb-2 !text-ink-56">{angle}</p> : null}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(24, draft.split('\n').length + 2)}
            className="w-full resize-y border border-line bg-surface p-4 text-[0.9375rem] leading-relaxed outline-none focus:border-ink"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(draft)}`}
              target="_blank"
              rel="noreferrer"
              className="label !text-white bg-ink px-4 py-2.5 !no-underline hover:bg-ink-72"
            >
              Open in WhatsApp
            </a>
            <button
              type="button"
              onClick={copy}
              className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            {assets.whatsappInvite.url ? (
              <a
                href={assets.whatsappInvite.url}
                target="_blank"
                rel="noreferrer"
                className="label border border-line px-4 py-2.5 !no-underline hover:border-ink hover:!text-ink"
              >
                Open the group
              </a>
            ) : null}
          </div>
          <p className="mt-4 !mb-0 !text-ink-56 text-[0.8125rem]">
            WhatsApp carries the message in but will not open a named group, so it asks which chat
            to put it in — pick Limitless Pro {COHORT.label}. Nothing gets sent until you send it,
            and it can still be edited there.
          </p>
          <p className="mt-2 !mb-0 !text-ink-56 text-[0.8125rem]">
            Nothing anyone wrote reaches this, and no one is named. Read it before it goes to
            everybody.
          </p>
        </div>
      ) : null}
    </div>
  )
}
