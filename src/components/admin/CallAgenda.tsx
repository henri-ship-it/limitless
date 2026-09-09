'use client'

import { useState } from 'react'

/**
 * The agenda for a call, read out of what the cohort has written this week.
 *
 * Kept editable and copyable rather than clever. Chris takes this into a room
 * with people in it; what he needs is something he can glance at, not a screen
 * to drive.
 */

type Item = { title: string; minutes?: number; why: string; ask: string }
type Agenda = { headline: string; items: Item[]; watch?: string[] }

export function CallAgenda({ week }: { week: number }) {
  const [kind, setKind] = useState<'dropin' | 'workshop'>('dropin')
  const [audience, setAudience] = useState<'pro' | 'all'>('pro')
  const [intent, setIntent] = useState('')
  const [agenda, setAgenda] = useState<Agenda | null>(null)
  const [meta, setMeta] = useState('')
  const [working, setWorking] = useState(false)
  const [problem, setProblem] = useState('')
  const [copied, setCopied] = useState(false)

  async function build() {
    setWorking(true)
    setProblem('')
    setCopied(false)
    try {
      const response = await fetch('/api/admin/agenda', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, audience, week, intent }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setProblem(payload.error ?? 'That did not work.')
        setAgenda(null)
        return
      }
      setAgenda(payload.agenda)
      setMeta(`Read from ${payload.writing} of ${payload.of} who have written something.`)
    } catch {
      setProblem('Could not reach the server.')
    } finally {
      setWorking(false)
    }
  }

  async function copy() {
    if (!agenda) return
    const text = [
      agenda.headline,
      '',
      ...agenda.items.map(
        (item, i) =>
          `${i + 1}. ${item.title}${item.minutes ? ` (${item.minutes} min)` : ''}\n   ${item.why}\n   Open with: ${item.ask}`,
      ),
      ...(agenda.watch?.length ? ['', 'Worth noticing:', ...agenda.watch.map((w) => `- ${w}`)] : []),
    ].join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="!mb-3 flex flex-wrap gap-1.5">
        {(
          [
            { key: 'dropin' as const, label: 'Wednesday drop-in' },
            { key: 'workshop' as const, label: 'Monthly workshop' },
          ]
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setKind(option.key)}
            aria-pressed={kind === option.key}
            className={`pill ${
              kind === option.key
                ? '!border-accent !bg-accent-soft !text-ink'
                : 'hover:!border-line-strong hover:!text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
        <span className="mx-1" />
        {(
          [
            { key: 'pro' as const, label: 'Pro only' },
            { key: 'all' as const, label: 'Everyone' },
          ]
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setAudience(option.key)}
            aria-pressed={audience === option.key}
            className={`pill ${
              audience === option.key
                ? '!border-accent !bg-accent-soft !text-ink'
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
          placeholder="Anything you already know you want to cover? Leave blank and it will decide."
          className="w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={build}
          disabled={working}
          className="label shrink-0 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-40"
        >
          {working ? 'Reading the week…' : agenda ? 'Build it again' : 'Build the agenda'}
        </button>
      </div>

      {problem ? <p className="mt-3 !mb-0 text-[0.875rem] text-ink">{problem}</p> : null}

      {agenda ? (
        <div className="mt-6">
          <p className="!mb-1 text-[1.0625rem] leading-relaxed text-ink">{agenda.headline}</p>
          <p className="!mb-5 text-[0.8125rem] !text-ink-40">{meta}</p>

          <ol className="!mb-0 !list-none !pl-0 flex flex-col">
            {agenda.items.map((item, i) => (
              <li key={i} className="border-t border-line py-4">
                <div className="!mb-1.5 flex flex-wrap items-baseline gap-2">
                  <span className="label !text-ink-40">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[1rem] font-medium text-ink">{item.title}</span>
                  {item.minutes ? <span className="pill">{item.minutes} min</span> : null}
                </div>
                <p className="!mb-2 text-[0.9375rem] leading-relaxed text-ink-72">{item.why}</p>
                <p className="!mb-0 border-l-2 border-line pl-4 text-[0.9375rem] leading-relaxed">
                  {item.ask}
                </p>
              </li>
            ))}
          </ol>

          {agenda.watch?.length ? (
            <div className="mt-6 border-t border-line pt-5">
              <p className="label !mb-2 !text-ink-56">Worth noticing</p>
              <ul className="!mb-0 !list-none !pl-0 flex flex-col gap-1.5">
                {agenda.watch.map((line, i) => (
                  <li key={i} className="text-[0.9375rem] leading-relaxed text-ink-72">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={copy}
            className="label mt-6 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
          >
            {copied ? 'Copied' : 'Copy the agenda'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
