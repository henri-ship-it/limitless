'use client'

import { useMemo, useState } from 'react'

import type { Assessment as Spec } from '@/content/assessments'
import { scoreAssessment } from '@/content/assessments'
import { leadStyle, styleFor } from '@/content/know-thyself'

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

  const lead = spec.slot === 'scorecard' ? leadStyle(scores) : undefined
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])

  return (
    <Card>
      <p className="label !tracking-[0.18em] !text-ink">{spec.title}</p>
      {lead ? (
        <>
          <h1 className="mt-6 text-[1.625rem] leading-tight font-medium tracking-[-0.022em]">
            You lead with {lead.name}
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-72">{lead.overview}</p>
          <dl className="mt-8 space-y-5">
            <Line term="Reads as" detail={lead.reads} />
            <Line term="Responds to" detail={lead.respondsTo} />
            <Line term="Where it wins" detail={lead.differentiator} />
            <Line term="Blindspot" detail={lead.blindspot} />
            <Line term="Bottleneck" detail={lead.bottleneck} />
          </dl>
        </>
      ) : (
        <h1 className="mt-6 text-[1.625rem] leading-tight font-medium tracking-[-0.022em]">
          Your result
        </h1>
      )}

      <div className="mt-10 space-y-4">
        {ranked.map(([category, value]) => (
          <div key={category}>
            <div className="flex items-baseline justify-between">
              <p className="text-[0.9375rem]">{styleFor(category)?.name ?? category}</p>
              <p className="font-mono text-[0.8125rem] text-ink-56">{value}%</p>
            </div>
            <div className="mt-2 h-1.5 w-full bg-ink-5">
              <div className="h-1.5 bg-accent" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-[0.875rem] leading-relaxed text-ink-40">
        {stored
          ? `Saved against ${email}. It will be on your profile next time you sign in.`
          : `We could not find a member at ${email}, so this result is not saved anywhere. Take a screenshot, or run it again with the address you joined with.`}
      </p>
    </Card>
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
