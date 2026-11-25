'use client'

import { useEffect, useMemo, useState } from 'react'

import type { Assessment as Spec } from '@/content/assessments'
import { scoreAssessment } from '@/content/assessments'
import { STYLES, styleFor } from '@/content/know-thyself'
import { DISCLAIMER, RESULT_INTRO, STEPS, STYLE_COPY } from '@/content/know-thyself-copy'
import { reportFor } from '@/content/know-thyself-report'
import { NORMS, NORM_RANGE } from '@/content/know-thyself-norms'
import {
  COMPONENTS,
  FIRE_INTRO,
  FIRE_NORMS,
  FIRE_RANGE,
  componentFor,
  lowestOf,
} from '@/content/light-the-fire-copy'
import { Points } from '@/components/Points'
import { Radar } from './Radar'
import {
  AlertIcon,
  CheckmarkIcon,
  CompassIcon,
  RouteIcon,
  ViewIcon,
} from './icons'
import { profileFrom } from '@/lib/style-profile'
import type { Preview } from '@/content/assessment-previews'

type Stage = 'intro' | 'questions' | 'details' | 'sending' | 'done'

/** The scale starts in the middle, so nobody is nudged by where the handle sits. */
const MIDDLE = 50

export function Assessment({
  spec,
  signedInAs,
  preview = null,
  previews = [],
}: {
  spec: Spec
  signedInAs: string | null
  /** An example result to open on, instead of the intro. Nothing is filed. */
  preview?: Preview | null
  /** The other examples, so one can be swapped for another in place. */
  previews?: Preview[]
}) {
  const [stage, setStage] = useState<Stage>(preview ? 'done' : 'intro')
  const [at, setAt] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [email, setEmail] = useState(signedInAs ?? '')
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [stored, setStored] = useState(false)
  const [emailed, setEmailed] = useState(false)

  /*
   * While a question is up, the page does not scroll on a phone.
   *
   * The card already fits the screen, so any scrolling is the page moving
   * under a thumb that was trying to drag the scale, which loses the answer
   * and the place at once. Locked only under the mobile breakpoint, in CSS,
   * so a laptop behaves normally.
   */
  useEffect(() => {
    if (stage !== 'questions') return
    document.body.classList.add('answering')
    return () => document.body.classList.remove('answering')
  }, [stage])

  const question = spec.questions[at]
  const answer = answers[at] ?? MIDDLE
  const scored = useMemo(() => scoreAssessment(spec, answers), [spec, answers])
  // An example result reads its numbers straight from the preview rather than
  // from forty untouched scales, which would otherwise all score fifty.
  const scores = preview ? preview.scores : scored

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
    const startedAt = Date.now()
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
      /*
       * The work is usually done in well under a second, which lands the
       * result before anybody has registered that they finished. Hold the
       * working screen until its last step has had a moment, and never cut it
       * short: the wait is doing something, it is just quick.
       */
      const held = Date.now() - startedAt
      if (held < WORKING_MS) await new Promise((done) => setTimeout(done, WORKING_MS - held))
      setStage('done')
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'That did not send')
      setStage('details')
    } finally {
      setSending(false)
    }
  }

  const behavioural = spec.slot === 'scorecard' || spec.slot === 'scorecardShort'
  const motivation = spec.slot === 'lightTheFire'

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
      <Card fill roomy={motivation}>
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

        {motivation ? (
          <Points
            value={answer}
            onChange={record}
            low={spec.low}
            high={spec.high}
            label={question.text}
          />
        ) : (
          <>
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
          </>
        )}

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
      <Card fill>
        <Working />
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
    <Wide
      above={
        preview && previews.length > 1 ? (
          <nav
            aria-label="Example results"
            className="mb-5 w-full max-w-xl border border-line bg-surface px-4 py-3"
          >
            <p className="font-mono text-[0.6875rem] tracking-[0.06em] uppercase text-ink-40">
              Example result
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {previews.map((option) => {
                const showing = option.key === preview.key
                return (
                  <li key={option.key}>
                    <a
                      href={`?preview=${option.key}`}
                      aria-current={showing ? 'page' : undefined}
                      className={
                        showing
                          ? 'inline-block border border-ink bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-surface'
                          : 'inline-block border border-line px-3 py-1.5 text-[0.8125rem] text-ink-56 hover:border-line-strong hover:text-ink'
                      }
                    >
                      {option.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null
      }
    >
      {profile ? (
        <>
          {/*
            * The plate. The printed report opens on an engraving over an old
            * map with the style written across it, and that is the whole
            * character of the thing, so the result opens on the same image
            * rather than on a flat panel. It bleeds to the edges of the card.
            */}
          <figure className="-m-8 mb-0 sm:-m-10 sm:mb-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/know-thyself/styles/${profile.lead.key}.jpg`}
              alt={`${profile.lead.name}, drawn as a plate from the Know Thyself report`}
              className="block w-full"
            />
          </figure>

          <div className="mt-9">
            {/* The style's own mark, the one printed in the journal and drawn
                on the radar below, so the three are recognisably the same
                thing before a word is read. */}
            <StyleMark styleKey={profile.lead.key} name={profile.lead.name} />
            <p className="mt-6 text-[0.9375rem] text-ink-56">You lead with</p>
            <h1 className="mt-2.5 font-caption text-[2.75rem] leading-[0.9] font-bold tracking-[-0.01em] uppercase">
              {profile.lead.name}
            </h1>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-72">{profile.summary}</p>
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
            norms={behavioural ? NORMS : undefined}
            ranges={behavioural ? NORM_RANGE : undefined}
          />
          {behavioural && (
            <p className="mt-6 flex items-center gap-2 text-[0.8125rem] leading-relaxed text-ink-40">
              <span aria-hidden className="inline-block h-3 w-0.5 shrink-0 bg-ink" />
              <span>
                The tick is the middle score of everybody who has taken this, and the shaded
                stretch is where the middle half of them landed. The figure in brackets is how far
                you sit from the tick.
              </span>
            </p>
          )}

          <Deep styleKey={profile.lead.key} name={profile.lead.name} />

          {behavioural && (
            <Radar
              scores={scores}
              lead={profile.lead.name}
              /*
               * Corner order, clockwise from the top right, which is how the
               * figure is drawn in the journal. Fixed rather than ranked, so
               * two people's radars can be laid side by side.
               */
              axes={['Dynamo', 'Analyst', 'Caretaker', 'Energiser']}
            />
          )}

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
      ) : motivation ? (
        <Motivation scores={scores} ranked={plain} />
      ) : (
        <>
          <h1 className="font-caption text-[2.25rem] leading-[0.95] font-bold uppercase">
            Your result
          </h1>
          <Bars ranked={plain.map(([name, value]) => [name, value] as const)} />
        </>
      )}

      {preview ? (
        <p className="mt-7 text-[0.875rem] leading-relaxed text-ink-40">
          Example scores, so the page can be read without sitting the assessment. Nothing here
          belongs to anybody and nothing was saved. A real sitting files against the member's
          profile and sends them a copy.
        </p>
      ) : (
        <p className="mt-7 text-[0.875rem] leading-relaxed text-ink-40">
          {stored
            ? `Saved against ${email}. It will be on your profile next time you sign in.`
            : `We could not find a member at ${email}, so this result is not saved anywhere. Run it again with the address you joined with if you meant to.`}
          {emailed ? ' A copy is on its way to your inbox.' : ''}
        </p>
      )}

      {profile && (
        <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-40">{DISCLAIMER}</p>
      )}

      {/*
        * The way out.
        *
        * This page is reached by scanning a printed journal, so it has no
        * platform chrome round it and somebody who finishes it was stranded.
        * A member goes back to their week; anybody else is offered the door
        * rather than shown a dead end.
        */}
      <div className="mt-12 border-t border-line pt-6">
        {signedInAs ? (
          <a
            href="/"
            className="text-[0.9375rem] font-medium underline underline-offset-4 hover:text-ink-56"
          >
            Back to Limitless
          </a>
        ) : (
          <p className="text-[0.9375rem] leading-relaxed text-ink-56">
            Already on the programme?{' '}
            <a href="/sign-in" className="font-medium text-ink underline underline-offset-4">
              Sign in
            </a>{' '}
            and this result goes on your profile.
          </p>
        )}
      </div>
    </Wide>
  )
}


/**
 * The longer writing, for the style somebody actually leads with.
 *
 * Only theirs. The other three stay on the short copy below, because four of
 * these on one screen is a wall rather than a read.
 */
function Deep({ styleKey, name }: { styleKey: string; name: string }) {
  const report = reportFor(styleKey)
  if (!report) return null
  return (
    <>
      <Section title={`More on ${name}`} />
      <p className="font-caption mt-5 text-[1.75rem] leading-[1.08] font-bold tracking-[-0.012em] uppercase">
        {report.strapline}
      </p>
      {report.opening.map((paragraph) => (
        <p key={paragraph} className="mt-4 text-[0.9375rem] leading-relaxed text-ink-72">
          {paragraph}
        </p>
      ))}

      <Heading icon={<ViewIcon className="h-[1.05rem] w-[1.05rem]" />}>How you show up</Heading>
      <dl className="mt-4 space-y-4">
        {report.showUp.map((trait) => (
          <div key={trait.name}>
            <dt className="text-[0.9375rem] font-medium">{trait.name}</dt>
            <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-72">{trait.detail}</dd>
          </div>
        ))}
      </dl>

      <Heading icon={<CheckmarkIcon className="h-[1.05rem] w-[1.05rem]" />}>When it works</Heading>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-72">{report.whenItWorks}</p>

      <Heading icon={<AlertIcon className="h-[1.05rem] w-[1.05rem]" />}>When overplayed</Heading>
      <dl className="mt-4 space-y-4">
        {report.overplayed.map((trait) => (
          <div key={trait.name}>
            <dt className="text-[0.9375rem] font-medium">{trait.name}</dt>
            <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-72">{trait.detail}</dd>
          </div>
        ))}
      </dl>

      <Heading icon={<CompassIcon className="h-[1.05rem] w-[1.05rem]" />}>Perspective checks</Heading>
      <dl className="mt-4 space-y-4">
        {report.checks.map((check) => (
          <div key={check.question}>
            <dt className="text-[0.9375rem] font-medium">{check.question}</dt>
            <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-56">{check.detail}</dd>
          </div>
        ))}
      </dl>

      <Heading icon={<RouteIcon className="h-[1.05rem] w-[1.05rem]" />}>Growth moves</Heading>
      <dl className="mt-4 space-y-4">
        {report.growth.map((move) => (
          <div key={move.name}>
            <dt className="text-[0.9375rem] font-medium">{move.name}</dt>
            <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-72">{move.detail}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 bg-ink-3 p-6 text-[1.0625rem] leading-relaxed text-ink-72">
        {report.reminder}
      </p>
    </>
  )
}


/**
 * Light The Fire, which reads the other way up.
 *
 * Know Thyself names what somebody leads with. This names what they are
 * shortest of, because these three are needs rather than traits: the one you
 * have least of is the one worth doing something about, and the assessment has
 * always been written that way. Keeping it round the right way matters more
 * than the symmetry with the other result.
 */
function Motivation({
  scores,
  ranked,
}: {
  scores: Record<string, number>
  ranked: [string, number][]
}) {
  const lowest = lowestOf(scores)
  const ordered = [...ranked].sort((a, b) => a[1] - b[1])

  return (
    <>
      <h1 className="font-caption text-[2.25rem] leading-[0.95] font-bold uppercase">
        Light the fire
      </h1>

      <div className="mt-6 space-y-4">
        {FIRE_INTRO.map((paragraph) => (
          <p key={paragraph} className="text-[0.9375rem] leading-relaxed text-ink-72">
            {paragraph}
          </p>
        ))}
      </div>

      {lowest && (
        <p className="mt-7 text-[1.0625rem] leading-relaxed">
          You scored lowest on your need for <strong className="font-medium">{lowest.name}</strong>,
          which makes it the one with the most to give you right now.
        </p>
      )}

      <Section title="Your three" />
      <Bars
        ranked={ordered.map(([name, value]) => [name, value] as const)}
        lead={lowest?.name}
        norms={FIRE_NORMS}
        ranges={FIRE_RANGE}
      />
      <p className="mt-6 flex items-center gap-2 text-[0.8125rem] leading-relaxed text-ink-40">
        <span aria-hidden className="inline-block h-3 w-0.5 shrink-0 bg-ink" />
        <span>
          The tick is the middle score of everybody who has taken this, and the shaded stretch is
          where the middle half of them landed. Motivation runs high across all three, so most
          sittings land above sixty.
        </span>
      </p>

      <div className="mt-12 space-y-4">
        {ordered.map(([name]) => {
          const component = componentFor(name) ?? COMPONENTS.find((c) => c.name === name)
          if (!component) return null
          const shortest = component.key === lowest?.key
          return (
            <section
              key={component.key}
              className={`border p-6 ${shortest ? 'border-accent bg-accent-soft/40' : 'border-line bg-bg'}`}
            >
              <div className="flex items-baseline gap-3">
                <h3 className="font-caption text-[1.125rem] leading-none font-bold uppercase">
                  {component.name}
                </h3>
                {shortest && <span className="label !tracking-[0.18em]">Shortest</span>}
                <span className="ml-auto font-mono text-[0.8125rem] tabular-nums text-ink-56">
                  {scores[name] ?? 0}%
                </span>
              </div>
              <p className="mt-3 text-[0.9375rem] text-ink-56">{component.reads}</p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-72">
                {component.detail}
              </p>
              <p className="mt-5 text-[0.9375rem] leading-relaxed font-medium">
                {component.prompt}
              </p>
            </section>
          )
        })}
      </div>
    </>
  )
}


/** How long the working screen runs before the result is allowed through. */
const WORKING_MS = 3200

/**
 * The pause between the last answer and the result.
 *
 * Every step here is a real one: the answers are scored, the scores are set
 * against the group, the result is assembled and a copy is sent. None of it
 * takes three seconds, but showing somebody a blank moment after thirty six
 * questions wastes the only point where they are actually curious. So the
 * steps are named and paced, and the result waits for them rather than the
 * other way round.
 */
function Working() {
  const steps = useMemo(
    () => [
      'Scoring your answers',
      'Comparing with everybody else',
      'Reading the shape of it',
      'Writing your result',
    ],
    [],
  )
  const [at, setAt] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setAt((step) => Math.min(step + 1, steps.length - 1)),
      WORKING_MS / steps.length,
    )
    return () => clearInterval(id)
  }, [steps.length])

  const through = Math.round(((at + 1) / steps.length) * 100)

  return (
    <div>
      <h1 className="font-caption text-[1.75rem] leading-[1] font-bold uppercase">
        Working it out
      </h1>

      <div className="mt-6 h-px w-full bg-line">
        <div
          className="h-px bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${through}%` }}
        />
      </div>

      <ol className="mt-8 space-y-4" aria-live="polite">
        {steps.map((step, index) => {
          const done = index < at
          const now = index === at
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                aria-hidden
                className={`inline-block h-2 w-2 shrink-0 ${
                  done ? 'bg-ink' : now ? 'animate-pulse bg-accent' : 'bg-ink-12'
                }`}
              />
              <span
                className={`text-[0.9375rem] transition-colors ${
                  done ? 'text-ink-40' : now ? 'text-ink' : 'text-ink-20'
                }`}
              >
                {step}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}


/**
 * A heading inside a section, with its mark.
 *
 * Sentence case and the body face. The display face is spent on the two places
 * that should be loud, the style name and its strapline, and spending it again
 * here is what flattened everything into one shout.
 */
/**
 * The heading of one block inside a style's longer writing.
 *
 * Five of these run down the page one after another. At text weight they read
 * as one continuous list, because nothing separates a heading from the
 * sentences under it, so each is set as a pill: a light grey a shade darker
 * than the card, fully rounded, the display face. Inverted was too heavy for
 * five in a row, which made the page read as five black bars.
 */
function Heading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="mt-11 mb-5 flex">
      <span className="inline-flex items-center gap-3 rounded-full bg-ink-8 py-2.5 pr-6 pl-5 font-caption text-[0.9375rem] leading-none font-bold tracking-[0.04em] text-ink uppercase">
        <span className="text-accent">{icon}</span>
        {children}
      </span>
    </h3>
  )
}

/**
 * A behavioural style's mark, as printed.
 *
 * Hosted SVG rather than inlined, because these four are artwork from the
 * journal rather than interface icons, and they are used at a few sizes.
 */
function StyleMark({
  styleKey,
  name,
  size = 44,
}: {
  styleKey: string
  name: string
  size?: number
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`/know-thyself/${styleKey}.svg`}
      alt={`The ${name} mark`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="block"
    />
  )
}

/**
 * A section rule.
 *
 * Deliberately quiet. It used to be set in the display face, bold and
 * uppercase, directly above a strapline that was also display, bold and
 * uppercase: two things shouting, separated only by size, which is no
 * hierarchy at all. This is a label on a rule, and the line under it is the
 * one that carries weight.
 */
function Section({ title }: { title: string }) {
  return (
    <h2 className="mt-14 border-t border-line pt-6 text-[0.75rem] leading-none font-medium tracking-[0.16em] text-ink-40 uppercase">
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

/**
 * The ranked styles, as a meter list.
 *
 * Aligned bars on one baseline rather than a radar, because the reader's job
 * here is to compare four values exactly and rank them, and a radar makes that
 * harder: area grows as the square of the value, and the shape changes with
 * the order the axes happen to sit in.
 *
 * The leading style carries the accent and the rest are grey. One thing is the
 * point and the others are context, so they are drawn that way.
 *
 * Where a norm exists, a tick marks what everybody else scored, because a
 * number on its own says very little. 63 reads differently once you know the
 * room averages 51.
 */
function Bars({
  ranked,
  lead,
  norms,
  ranges,
}: {
  ranked: readonly (readonly [string, number])[]
  lead?: string
  norms?: Record<string, number>
  ranges?: Record<string, { p25: number; p75: number }>
}) {
  return (
    <div className="mt-8 space-y-6">
      {ranked.map(([name, value]) => {
        const leading = name === lead
        const average = norms?.[name]
        const band = ranges?.[name]
        const gap = average === undefined ? null : Math.round(value - average)
        return (
          <div key={name}>
            <div className="flex items-baseline justify-between gap-3">
              <p className={leading ? 'text-[0.9375rem] font-medium' : 'text-[0.9375rem] text-ink-56'}>
                {styleFor(name)?.name ?? name}
              </p>
              <p className="font-mono text-[0.8125rem] tabular-nums text-ink-56">
                {value}%
                {/* The distance from the middle, without brackets round it.
                    A signed number already reads as a difference. */}
                {gap !== null && gap !== 0 && (
                  <span className="text-ink-40">
                    {' '}
                    {gap > 0 ? '+' : ''}
                    {gap}
                  </span>
                )}
              </p>
            </div>

            <div className="relative mt-2 h-1.5 w-full bg-ink-5">
              {band && (
                <span
                  aria-hidden
                  title={`Middle half of the group, ${band.p25}% to ${band.p75}%`}
                  className="absolute inset-y-0 bg-ink-8"
                  style={{ left: `${band.p25}%`, width: `${band.p75 - band.p25}%` }}
                />
              )}
              <div
                className={`h-1.5 transition-[width] duration-700 ${leading ? 'bg-accent' : 'bg-ink-20'}`}
                style={{ width: `${value}%` }}
              />
              {average !== undefined && (
                <span
                  aria-hidden
                  title={`Average ${Math.round(average)}%`}
                  className="absolute top-[-3px] h-3 w-0.5 bg-ink ring-2 ring-surface"
                  style={{ left: `calc(${average}% - 1px)` }}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** The result needs more room than a question does. */
/**
 * The result sits on paper.
 *
 * A grain tile over the card, at a low opacity, because the printed report is
 * an analogue object and a flat white panel is the thing that makes a screen
 * version of it feel like software. It is a background on the card itself, so
 * nothing in the content has to know about it.
 */
function Wide({ children, above }: { children: React.ReactNode; above?: React.ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center bg-bg px-5 py-10 sm:px-6 sm:py-16">
      {above}
      <div
        className="w-full max-w-xl border border-line bg-surface p-6 sm:p-10"
        style={{ backgroundImage: "url('/know-thyself/paper.png')", backgroundSize: '256px 256px' }}
      >
        {children}
      </div>
    </main>
  )
}

function Card({
  children,
  fill,
  /** Seven circles and two end labels need more width than a slider does. */
  roomy,
}: {
  children: React.ReactNode
  fill?: boolean
  roomy?: boolean
}) {
  return (
    <main
      className={`flex items-center justify-center bg-bg px-5 sm:px-6 ${
        fill ? 'min-h-[100dvh] py-5 sm:py-16' : 'min-h-[100dvh] py-10 sm:py-16'
      }`}
    >
      <div
        className={`w-full border border-line bg-surface p-6 sm:p-8 ${
          roomy ? 'max-w-xl' : 'max-w-md'
        }`}
      >
        {children}
      </div>
    </main>
  )
}


const button =
  'mt-8 w-full bg-ink px-4 py-3 text-[0.9375rem] text-white transition-opacity hover:opacity-90 disabled:opacity-40'
