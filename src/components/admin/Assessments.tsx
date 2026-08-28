'use client'

import { useState } from 'react'
import { leadStyle, styleFor } from '@/content/know-thyself'
import { since } from '@/lib/format'

export type Filled = {
  scores?: Record<string, number>
  notes?: Record<string, string>
  receivedAt?: string
}

export type AssessmentData = {
  scorecard?: Filled
  preAssessment?: Filled
}

/**
 * What a member told us before and during the programme, in two tabs.
 *
 * Kept side by side because they answer different questions: the scorecard says
 * how to talk to somebody, the survey says what they came here to fix.
 */
export function Assessments({ data }: { data: AssessmentData }) {
  const tabs = [
    { key: 'know-thyself' as const, label: 'Know Thyself', filled: data.scorecard },
    { key: 'pre-assessment' as const, label: 'Pre-assessment', filled: data.preAssessment },
  ].filter((t) => t.filled)

  const [active, setActive] = useState(tabs[0]?.key)
  if (!tabs.length) return null

  const current = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            aria-pressed={current.key === tab.key}
            className={`pill ${
              current.key === tab.key
                ? '!border-accent-ink !bg-accent-soft !text-ink'
                : 'hover:!border-line-strong hover:!text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {current.key === 'know-thyself' ? (
        <KnowThyself filled={current.filled!} />
      ) : (
        <Survey filled={current.filled!} />
      )}
    </div>
  )
}

function KnowThyself({ filled }: { filled: Filled }) {
  const scores = filled.scores ?? {}
  const lead = leadStyle(scores)
  const top = Math.max(100, ...Object.values(scores))

  return (
    <div>
      {lead ? (
        <div className="mb-6 flex items-start gap-4 border border-line p-4">
          <img src={lead.icon} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
          <div>
            <p className="!mb-1 text-[1rem] font-medium text-ink">Leads with {lead.name}</p>
            <p className="!mb-1 text-[0.875rem] text-ink-72">{lead.reads}</p>
            <p className="!mb-0 text-[0.875rem] text-ink">
              <span className="label">Writing to them: </span>
              {lead.respondsTo}
            </p>
          </div>
        </div>
      ) : null}

      <dl className="!mb-0">
        {Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => {
            const style = styleFor(name)
            return (
              <div
                key={name}
                className="grid grid-cols-[1.75rem_8rem_1fr_2.5rem] items-center gap-3 border-t border-line py-2.5"
              >
                <dt>
                  {style ? (
                    <img src={style.icon} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
                  ) : (
                    <span className="label">·</span>
                  )}
                </dt>
                <dd className="label !text-ink-72">{style?.name ?? name}</dd>
                <dd className="h-1 bg-ink-8">
                  <span
                    className="block h-full bg-ink"
                    style={{ width: `${Math.min(100, Math.max(0, (value / top) * 100))}%` }}
                  />
                </dd>
                <dd className="label !text-ink text-right">{value}</dd>
              </div>
            )
          })}
      </dl>

      <Notes filled={filled} />
      <Received filled={filled} />
    </div>
  )
}

function Survey({ filled }: { filled: Filled }) {
  const scores = Object.entries(filled.scores ?? {}).sort((a, b) => b[1] - a[1])
  const top = Math.max(100, ...scores.map(([, v]) => v))

  return (
    <div>
      <Notes filled={filled} />
      {scores.length ? (
        <dl className="!mb-0 mt-5">
          {scores.map(([name, value]) => (
            <div
              key={name}
              className="grid grid-cols-[10rem_1fr_2.5rem] items-center gap-4 border-t border-line py-2"
            >
              <dt className="label !text-ink-72">{name}</dt>
              <dd className="h-1 bg-ink-8">
                <span
                  className="block h-full bg-ink"
                  style={{ width: `${Math.min(100, Math.max(0, (value / top) * 100))}%` }}
                />
              </dd>
              <dd className="label !text-ink text-right">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <Received filled={filled} />
    </div>
  )
}

/** Free text answers, which on the survey are the part worth reading. */
function Notes({ filled }: { filled: Filled }) {
  const notes = Object.entries(filled.notes ?? {})
  if (!notes.length) return null

  return (
    <dl className="!mb-0">
      {notes.map(([question, answer]) => (
        <div key={question} className="border-t border-line py-3">
          <dt className="label !mb-1 !text-ink-56">{question}</dt>
          <dd className="text-[0.9375rem] leading-relaxed text-ink">{answer}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Sits last on both tabs, so the answers are not interrupted by bookkeeping. */
function Received({ filled }: { filled: Filled }) {
  if (!filled.receivedAt) return null
  return (
    <p className="mt-5 !mb-0 !text-ink-40 text-[0.8125rem]">
      Received {since(filled.receivedAt)}.
    </p>
  )
}
