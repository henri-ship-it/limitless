'use client'

import { useMemo, useState } from 'react'

import type { Assessment as Spec } from '@/content/assessments'
import { scoreAssessment } from '@/content/assessments'
import { styleFor } from '@/content/know-thyself'
import { profileFrom } from '@/lib/style-profile'

type Stage = 'intro' | 'questions' | 'details' | 'done'

/** The scale starts in the middle, so nobody is nudged by where the handle sits. */
const MIDDLE = 50

export function Assessment({ spec }: { spec: Spec }) {
  const [stage, setStage] = useState<Stage>('intro')
  const [at, setAt] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [stored, setStored] = useState(false)
  const [emailed, setEmailed] = useState(false)

  const question = spec.questions[at]
  const answer = answers[at] ?? MIDDLE
  const scores = useMemo(() => scoreAssessment(spec, answers), [spec, answers])

  function record(value: number) {
    setAnswers((held) => ({ ...held, [at]: value }))
  }

  function next() {
    // The handle sits in the middle until it is moved, and a middling answer is
    // a real answer, so an untouched scale is recorded rather than skipped.
    setAnswers((held) => ({ ...held, [at]: held[at] ?? MIDDLE }))
    if (at + 1 < spec.questions.length) setAt(at + 1)
    else setStage('details')
  }

  async function send() {
    setSending(true)
    setProblem(null)
    try {
      const response = await fetch(`/api/assessment/${spec.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? 'That did not send')
      // A result is scored either way, but it is only filed when the address
      // belongs to a member. Saying otherwise would be a lie on the page.
      setStored(payload?.status === 'stored')
      setEmailed(payload?.emailed === 'sent')
      setStage('done')
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'That did not send')
    } finally {
      setSending(false)
    }
  }

  if (stage === 'intro') {
    return (
      <Card>
        <p className="label !tracking-[0.18em] !text-ink">Limitless</p>
        <h1 className="mt-6 text-[1.625rem] leading-tight font-medium tracking-[-0.022em]">
          {spec.title}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-56">
          {spec.questions.length} statements. Drag each one to where it sits for you, between{' '}
          {spec.low.toLowerCase()} and {spec.high.toLowerCase()}. There are no right answers, and
          the quick instinct is usually the honest one.
        </p>
        <button type="button" onClick={() => setStage('questions')} className={button}>
          Begin
        </button>
      </Card>
    )
  }

  if (stage === 'questions') {
    const through = Math.round((at / spec.questions.length) * 100)
    return (
      <Card>
        <div className="flex items-baseline justify-between">
          <p className="label !tracking-[0.18em] !text-ink-40">
            {at + 1} of {spec.questions.length}
          </p>
          <p className="font-mono text-[0.75rem] text-ink-40">{through}%</p>
        </div>
        <div className="mt-3 h-px w-full bg-line">
          <div className="h-px bg-accent transition-all" style={{ width: `${through}%` }} />
        </div>

        <p className="mt-10 min-h-[4.5rem] text-[1.25rem] leading-snug font-medium tracking-[-0.018em]">
          {question.text}
        </p>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={answer}
          onChange={(event) => record(Number(event.target.value))}
          aria-label={question.text}
          className="mt-8 w-full accent-[#04dfbf]"
        />
        <div className="mt-2 flex justify-between font-mono text-[0.75rem] text-ink-40">
          <span>{spec.low}</span>
          <span>{spec.high}</span>
        </div>

        <div className="mt-8 flex items-center gap-3">
          {at > 0 && (
            <button
              type="button"
              onClick={() => setAt(at - 1)}
              className="border border-line px-4 py-3 text-[0.9375rem] text-ink-56 hover:text-ink"
            >
              Back
            </button>
          )}
          <button type="button" onClick={next} className={`${button} !mt-0 flex-1`}>
            {at + 1 === spec.questions.length ? 'Finish' : 'Next'}
          </button>
        </div>
      </Card>
    )
  }

  if (stage === 'details') {
    return (
      <Card>
        <p className="label !tracking-[0.18em] !text-ink">Almost there</p>
        <h1 className="mt-6 text-[1.625rem] leading-tight font-medium tracking-[-0.022em]">
          Where should this go?
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-56">
          Use the address you joined with and this lands on your profile alongside the rest of
          your programme.
        </p>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="mt-6 w-full border border-line bg-bg px-4 py-3 text-[0.9375rem] outline-none focus:border-line-strong"
        />
        {problem && <p className="mt-3 text-[0.875rem] text-flame">{problem}</p>}
        <button type="button" onClick={send} disabled={sending || !email} className={button}>
          {sending ? 'Sending' : 'See my result'}
        </button>
      </Card>
    )
  }

  const profile = profileFrom(scores)
  const plain = Object.entries(scores).sort((a, b) => b[1] - a[1])

  return (
    <Wide>
      <p className="label !tracking-[0.18em] !text-ink">{spec.title}</p>

      {profile ? (
        <>
          <div className="mt-6 flex items-start gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.lead.icon}
              alt=""
              aria-hidden
              className="mt-1 h-12 w-12 shrink-0"
            />
            <div>
              <h1 className="text-[2rem] leading-[1.1] font-medium tracking-[-0.026em]">
                You lead with {profile.lead.name}
              </h1>
              <p className="mt-2 text-[0.9375rem] text-ink-56">{profile.lead.overview}</p>
            </div>
          </div>

          <p className="mt-6 border-l-2 border-accent pl-5 text-[1.0625rem] leading-relaxed text-ink-72">
            {profile.summary}
          </p>

          <Bars ranked={profile.ranked.map((row) => [row.style.name, row.value] as const)} lead={profile.lead.name} />

          <div className="mt-12 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            <Line term="Reads as" detail={profile.lead.reads} />
            <Line term="Responds to" detail={profile.lead.respondsTo} />
            <Line term="Where it wins" detail={profile.lead.differentiator} />
            <Line term="Blindspot" detail={profile.lead.blindspot} />
            <Line term="Bottleneck" detail={profile.lead.bottleneck} />
            <Line
              term={`Least like you: ${profile.shadow.name}`}
              detail={`${profile.shadow.overview} It is the one you will reach for last when a situation calls for it.`}
            />
          </div>

          <p className="mt-12 border-t border-line pt-7 text-[0.9375rem] leading-relaxed text-ink-72">
            None of this is a box. It is a starting point, and the useful part is noticing where{' '}
            {profile.support.name} shows up instead.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-[2rem] leading-[1.1] font-medium tracking-[-0.026em]">
            Your result
          </h1>
          <Bars ranked={plain.map(([name, value]) => [name, value] as const)} />
        </>
      )}

      <p className="mt-7 text-[0.875rem] leading-relaxed text-ink-40">
        {stored
          ? `Saved against ${email}. It will be on your profile next time you sign in.`
          : `We could not find a member at ${email}, so this result is not saved anywhere. Run it again with the address you joined with if you meant to.`}
        {emailed ? ' A copy is on its way to your inbox.' : ''}
      </p>
    </Wide>
  )
}

/** The ranked category bars, with the leading one picked out. */
function Bars({
  ranked,
  lead,
}: {
  ranked: readonly (readonly [string, number])[]
  lead?: string
}) {
  return (
    <div className="mt-10 space-y-5">
      {ranked.map(([name, value]) => {
        const leading = name === lead
        return (
          <div key={name}>
            <div className="flex items-baseline justify-between">
              <p className={leading ? 'text-[0.9375rem] font-medium' : 'text-[0.9375rem] text-ink-56'}>
                {styleFor(name)?.name ?? name}
              </p>
              <p className="font-mono text-[0.8125rem] text-ink-56 tabular-nums">{value}%</p>
            </div>
            <div className="mt-2 h-1.5 w-full bg-ink-5">
              <div
                className={`h-1.5 transition-[width] duration-700 ${leading ? 'bg-accent' : 'bg-ink-20'}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** The result needs more room than a question does. */
function Wide({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-start justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-xl border border-line bg-surface p-8 sm:p-10">{children}</div>
    </main>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-16">
      <div className="w-full max-w-md border border-line bg-surface p-8">{children}</div>
    </main>
  )
}

function Line({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="label !tracking-[0.18em] !text-ink-40">{term}</dt>
      <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-72">{detail}</dd>
    </div>
  )
}

const button =
  'mt-8 w-full bg-ink px-4 py-3 text-[0.9375rem] text-white transition-opacity hover:opacity-90 disabled:opacity-40'
