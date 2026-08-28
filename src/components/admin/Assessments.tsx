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

/**
 * The pre-assessment runs to fifty-odd answers, which is a wall unless it is
 * sorted by what it costs to read.
 *
 * What somebody wrote in their own words comes first and in full. The importance
 * ratings become one ranked list, because ten separate rows saying "9" tell you
 * less than seeing them in order. Everything short is folded away until asked
 * for.
 */
function Survey({ filled }: { filled: Filled }) {
  const notes = Object.entries(filled.notes ?? {})
  const written = notes.filter(([, answer]) => answer.length > 60)
  const ratings = notes
    .filter(([, answer]) => answer.length <= 60 && /^\d+(\.\d+)?$/.test(answer.trim()))
    .sort((a, b) => Number(b[1]) - Number(a[1]))
  const brief = notes.filter(
    ([, answer]) => answer.length <= 60 && !/^\d+(\.\d+)?$/.test(answer.trim()),
  )

  const scores = Object.entries(filled.scores ?? {})
    .filter(([name]) => name !== 'Overall')
    .sort((a, b) => b[1] - a[1])
  const top = Math.max(100, ...scores.map(([, v]) => v))

  return (
    <div>
      {scores.length ? (
        <dl className="!mb-8">
          {scores.map(([name, value]) => (
            <div
              key={name}
              className="grid grid-cols-[11rem_1fr_4.5rem] items-center gap-4 border-t border-line py-2"
            >
              <dt className="label !text-ink-72">{name}</dt>
              {value > 0 ? (
                <>
                  <dd className="h-1 bg-ink-8">
                    <span
                      className="block h-full bg-ink"
                      style={{ width: `${Math.min(100, (value / top) * 100)}%` }}
                    />
                  </dd>
                  <dd className="label !text-ink text-right">{value}</dd>
                </>
              ) : (
                // A survey section that carries no scoring reads as zero out of
                // a hundred otherwise, which is not what it means.
                <dd className="label col-span-2 !text-ink-40 text-right">not scored</dd>
              )}
            </div>
          ))}
        </dl>
      ) : null}

      {written.length ? (
        <>
          <p className="label !mb-3 !text-ink">In their words</p>
          <dl className="!mb-8">
            {written.map(([question, answer]) => (
              <div key={question} className="border-t border-line py-3">
                <dt className="label !mb-1.5 !text-ink-56">{question}</dt>
                <dd className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {ratings.length ? (
        <>
          <p className="label !mb-3 !text-ink">What matters most to them</p>
          <dl className="!mb-8">
            {ratings.map(([question, answer]) => (
              <div
                key={question}
                className="grid grid-cols-[1fr_2.5rem] items-baseline gap-4 border-t border-line py-2"
              >
                <dt className="text-[0.9375rem] text-ink-72">{question}</dt>
                <dd className="label !text-ink text-right">{answer}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {brief.length ? (
        <details className="!mb-0 border-t border-line pt-3">
          <summary className="label cursor-pointer hover:!text-ink">
            {brief.length} shorter answers
          </summary>
          <dl className="!mb-0 mt-3">
            {brief.map(([question, answer]) => (
              <div
                key={question}
                className="grid gap-1 border-t border-line py-2 sm:grid-cols-[1fr_12rem] sm:gap-4"
              >
                <dt className="text-[0.9375rem] text-ink-72">{question}</dt>
                <dd className="text-[0.9375rem] text-ink">{answer}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}

      <Received filled={filled} />
    </div>
  )
}

/** Free text answers, as they appear on the Know Thyself tab. */
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
