'use client'

import { useMemo, useState } from 'react'

import type { Assessment as Spec } from '@/content/assessments'
import { scoreAssessment } from '@/content/assessments'
import { STYLES, styleFor } from '@/content/know-thyself'
import { DISCLAIMER, RESULT_INTRO, STEPS, STYLE_COPY } from '@/content/know-thyself-copy'
import { profileFrom } from '@/lib/style-profile'

type Stage = 'intro' | 'questions' | 'details' | 'sending' | 'done'

/** The scale starts in the middle, so nobody is nudged by where the handle sits. */
const MIDDLE = 50

export function Assessment({ spec, signedInAs }: { spec: Spec; signedInAs: string | null }) {
  const [stage, setStage] = useState<Stage>('intro')
  const [at, setAt] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [email, setEmail] = useState(signedInAs ?? '')
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
    if (at + 1 < spec.questions.length) {
      setAt(at + 1)
      return
    }
    /*
     * Somebody signed in has already told us their address, and asking again
     * is how the wrong one gets typed. Their result files against the account
     * they are sitting in.
     */
    if (signedInAs) void send(signedInAs)
    else setStage('details')
  }

  async function send(address: string) {
    setSending(true)
    setStage('sending')
    setProblem(null)
    try {
      const response = await fetch(`/api/assessment/${spec.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address, answers }),
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
      setStage('details')
    } finally {
      setSending(false)
    }
  }

  const behavioural = spec.slot === 'scorecard' || spec.slot === 'scorecardShort'

  if (stage === 'intro') {
    return (
      <Card>
        <h1 className="font-caption text-[2.25rem] leading-[0.95] font-bold tracking-[-0.01em] uppercase">
          {spec.title}
        </h1>

        {behavioural ? (
          <ul className="mt-8 space-y-5">
            {STEPS.map((step) => (
              <li key={step.title}>
                <p className="text-[0.9375rem] font-medium">{step.title}</p>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-56">{step.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-56">
            {spec.questions.length} statements. Drag each one to where it sits for you, between{' '}
            {spec.low.toLowerCase()} and {spec.high.toLowerCase()}.
          </p>
        )}

        <button type="button" onClick={() => setStage('questions')} className={button}>
          Start here
        </button>

        <p className="mt-7 text-[0.8125rem] leading-relaxed text-ink-40">
          {spec.questions.length} statements, about five minutes. {behavioural ? DISCLAIMER : ''}
        </p>
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
          className="scale mt-8"
          style={{
            background: `linear-gradient(90deg, var(--color-accent-soft) 0%, var(--color-accent) 100%) 0 0 / ${answer}% 100% no-repeat, var(--color-ink-8)`,
          }}
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

  if (stage === 'sending') {
    return (
      <Card>
        <p className="text-[0.9375rem] text-ink-56">Working out your result.</p>
      </Card>
    )
  }

  if (stage === 'details') {
    return (
      <Card>
        <h1 className="text-[1.625rem] leading-tight font-medium tracking-[-0.022em]">
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
        <button type="button" onClick={() => send(email)} disabled={sending || !email} className={button}>
          {sending ? 'Sending' : 'See my result'}
        </button>
      </Card>
    )
  }

  const profile = profileFrom(scores)
  const plain = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const scoreOf = (name: string) =>
    profile?.ranked.find((row) => row.style.name === name)?.value ?? 0

  return (
    <Wide>
      {profile ? (
        <>
          {/*
            * The one dark panel on the page. The printed report leans heavily
            * on black and the accent, and the lead style is the thing somebody
            * came for, so it gets that treatment and nothing else does.
            */}
          <div className="-m-8 mb-0 bg-ink p-8 sm:-m-10 sm:mb-0 sm:p-10">
            <div className="flex items-start gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.lead.icon} alt="" aria-hidden className="mt-1 h-14 w-14 shrink-0 invert" />
              <div>
                <p className="text-[0.9375rem] text-white/56">You lead with</p>
                <h1 className="font-caption text-[2.75rem] leading-[0.9] font-bold tracking-[-0.01em] text-white uppercase">
                  {profile.lead.name}
                </h1>
              </div>
            </div>
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-white/72">
              {profile.summary}
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {RESULT_INTRO.map((paragraph) => (
              <p key={paragraph} className="text-[0.9375rem] leading-relaxed text-ink-72">
                {paragraph}
              </p>
            ))}
          </div>

          <Section title="Your profile" />
          <Bars
            ranked={profile.ranked.map((row) => [row.style.name, row.value] as const)}
            lead={profile.lead.name}
          />

          <Section title="The four styles" />

          <div className="mt-8 space-y-4">
            {[profile.lead, ...STYLES.filter((s) => s.key !== profile.lead.key)].map((style) => (
              <StyleCard
                key={style.key}
                name={style.name}
                icon={style.icon}
                value={scoreOf(style.name)}
                copy={STYLE_COPY[style.key]}
                leading={style.key === profile.lead.key}
              />
            ))}
          </div>

          <p className="mt-10 border-t border-line pt-7 text-[0.9375rem] leading-relaxed text-ink-72">
            These are tendencies, not fixed positions. Where you sit moves with the room,
            the pressure and the day, and {profile.support.name} will show up as readily
            as {profile.lead.name} in the right conditions.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-caption text-[2.25rem] leading-[0.95] font-bold uppercase">
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

      {profile && (
        <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-40">{DISCLAIMER}</p>
      )}
    </Wide>
  )
}

/** A plain section heading. */
function Section({ title }: { title: string }) {
  return (
    <h2 className="font-caption mt-14 border-t border-line pt-7 text-[1.25rem] leading-none font-bold uppercase">
      {title}
    </h2>
  )
}

/**
 * One style, with the writing that was published alongside it.
 *
 * Everyone sees all four. The lead one is picked out rather than being the
 * only one written up, because the styles somebody scores low on are the ones
 * they most need to recognise in other people.
 */
function StyleCard({
  name,
  icon,
  value,
  copy,
  leading,
}: {
  name: string
  icon: string
  value: number
  copy: StyleCopyShape | undefined
  leading: boolean
}) {
  if (!copy) return null
  return (
    <section
      className={`border p-6 ${leading ? 'border-accent bg-accent-soft/40' : 'border-line bg-bg'}`}
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" aria-hidden className="h-7 w-7 shrink-0" />
        <h3 className="font-caption text-[1.125rem] leading-none font-bold uppercase">{name}</h3>
        {leading && <span className="label !tracking-[0.18em]">Yours</span>}
        <span className="ml-auto font-mono text-[0.8125rem] text-ink-56 tabular-nums">
          {value}%
        </span>
      </div>

      <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-72">{copy.definition}</p>

      <ul className="mt-4 space-y-2">
        {copy.marks.map((mark) => (
          <li key={mark} className="flex gap-3 text-[0.9375rem] leading-relaxed">
            <span aria-hidden className="mt-[0.55rem] h-px w-3 shrink-0 bg-ink-20" />
            <span>{mark}</span>
          </li>
        ))}
      </ul>

      <p className="label mt-6 !tracking-[0.18em] !text-ink-40">Be careful</p>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-72">{copy.careful}</p>

      <p className="label mt-6 !tracking-[0.18em] !text-ink-40">Counter weights</p>
      <ul className="mt-2 space-y-1.5">
        {copy.counterWeights.map((question) => (
          <li key={question} className="text-[0.9375rem] leading-relaxed text-ink-72">
            {question}
          </li>
        ))}
      </ul>
    </section>
  )
}

type StyleCopyShape = (typeof STYLE_COPY)[string]

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


const button =
  'mt-8 w-full bg-ink px-4 py-3 text-[0.9375rem] text-white transition-opacity hover:opacity-90 disabled:opacity-40'
