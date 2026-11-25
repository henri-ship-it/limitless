'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Points } from '@/components/Points'
import {
  DOMAINS,
  biggestMove,
  lengthOf,
  movement,
  spineScores,
  type Interstitial,
  type Journey as Spec,
  type Movement,
  type Question,
} from '@/content/journey'
import { painFor, testimonialsFor, type Testimonial } from '@/content/testimonials'

/**
 * One run through the baseline or the reflection.
 *
 * Built as rounds rather than as a form. The thing being replaced was between
 * 38 and 61 questions on one page, and the complaint about it was never the
 * questions, it was that handing over all of that bought you nothing until the
 * end. So: five short rounds, each announced, each followed by something given
 * back, and a bar that only ever moves forward.
 *
 * One question on screen at a time, which costs a tap and buys attention. The
 * open questions are the point of the exercise and nobody writes three good
 * paragraphs on a page that is also showing them thirty sliders.
 */

type Stage =
  | { at: 'intro' }
  | { at: 'round'; round: number }
  | { at: 'question'; round: number; index: number }
  | { at: 'between'; round: number }
  | { at: 'sending' }
  | { at: 'done' }

export type Answers = Record<string, number | string | string[]>

export function Journey({
  spec,
  firstName,
  welcomeCall,
  /** The member's baseline, when they have one. Only the reflection uses it. */
  previous,
  preview = 'no',
}: {
  spec: Spec
  firstName: string | null
  welcomeCall: string | null
  previous: Record<string, number> | null
  /*
   * 'result' opens on a finished example, for looking at the page without
   * filling it in. 'walk' runs the real thing from the start with nothing
   * pre-filled, for clicking through the flow; it ends on the example result
   * rather than saving, because there is nobody signed in to save it against.
   */
  preview?: 'no' | 'result' | 'walk'
}) {
  const example = preview !== 'no'
  const [stage, setStage] = useState<Stage>(
    preview === 'result' ? { at: 'done' } : { at: 'intro' },
  )
  const [answers, setAnswers] = useState<Answers>(preview === 'result' ? EXAMPLE : {})
  const [problem, setProblem] = useState<string | null>(null)

  const total = useMemo(() => lengthOf(spec), [spec])

  /* While a question is up the page does not scroll on a phone: the card fits,
     so any scroll is a thumb that missed the control it was aiming for. */
  useEffect(() => {
    if (stage.at !== 'question') return
    document.body.classList.add('answering')
    return () => document.body.classList.remove('answering')
  }, [stage])

  /** How many questions sit before the start of a round. */
  function offsetOf(round: number): number {
    return spec.rounds.slice(0, round).reduce((sum, r) => sum + r.questions.length, 0)
  }

  function answered(question: Question): boolean {
    const value = answers[question.id]
    if (question.kind === 'text') return question.optional ? true : typeof value === 'string' && value.trim().length > 0
    if (question.kind === 'multi' || question.kind === 'rank') {
      const picked = Array.isArray(value) ? value : []
      return question.kind === 'rank' ? picked.length === question.limit : picked.length > 0
    }
    return value !== undefined
  }

  function set(id: string, value: number | string | string[]) {
    setAnswers((held) => ({ ...held, [id]: value }))
  }

  /*
   * Adding and removing a pick, worked out from the answers as they are at the
   * moment of the tap rather than from the render that drew the button.
   *
   * Two taps inside one frame, which is a double tap or an impatient thumb,
   * both read the same list if this is computed from a closure, so the second
   * overwrites the first and a pick silently vanishes. Doing it inside the
   * updater is the only version that cannot drop one.
   */
  function toggle(id: string, option: string, limit: number) {
    setAnswers((held) => {
      const picked = Array.isArray(held[id]) ? (held[id] as string[]) : []
      const on = picked.includes(option)
      if (!on && picked.length >= limit) return held
      return { ...held, [id]: on ? picked.filter((p) => p !== option) : [...picked, option] }
    })
  }

  function advance(round: number, index: number) {
    const questions = spec.rounds[round].questions
    if (index + 1 < questions.length) {
      setStage({ at: 'question', round, index: index + 1 })
      return
    }
    if (spec.rounds[round].interstitial) {
      setStage({ at: 'between', round })
      return
    }
    nextRound(round)
  }

  function nextRound(round: number) {
    if (round + 1 < spec.rounds.length) setStage({ at: 'round', round: round + 1 })
    else void send()
  }

  async function send() {
    setStage({ at: 'sending' })
    setProblem(null)
    const startedAt = Date.now()
    // Walking the flow signed out has nothing to save it against, so it shows
    // the result it has rather than failing on a 401 at the final step.
    if (preview === 'walk') {
      await new Promise((done) => setTimeout(done, WORKING_MS))
      setStage({ at: 'done' })
      return
    }
    try {
      const response = await fetch(`/api/journey/${spec.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? 'That did not save')
      const held = Date.now() - startedAt
      if (held < WORKING_MS) await new Promise((done) => setTimeout(done, WORKING_MS - held))
      setStage({ at: 'done' })
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'That did not save')
      setStage({ at: 'between', round: spec.rounds.length - 1 })
    }
  }

  if (stage.at === 'intro') {
    return (
      <Card>
        <h1 className="font-caption text-[2.5rem] leading-[0.95] font-bold tracking-[-0.01em] uppercase">
          {spec.title}
        </h1>
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-72">{spec.lead}</p>

        <ul className="mt-9 space-y-5">
          {spec.steps.map((step) => (
            <li key={step.title}>
              <p className="text-[0.9375rem] font-medium">{step.title}</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-56">{step.detail}</p>
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => setStage({ at: 'round', round: 0 })} className={button}>
          {firstName ? `Start, ${firstName}` : 'Start'}
        </button>
      </Card>
    )
  }

  if (stage.at === 'round') {
    const round = spec.rounds[stage.round]
    return (
      <Card>
        <Progress done={offsetOf(stage.round)} total={total} />
        <p className="mt-10 font-mono text-[0.6875rem] tracking-[0.12em] text-ink-40 uppercase">
          Round {stage.round + 1} of {spec.rounds.length}
        </p>
        <h2 className="mt-3 font-caption text-[2.25rem] leading-[0.95] font-bold uppercase">
          {round.title}
        </h2>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-72">{round.lead}</p>
        <p className="mt-6 text-[0.875rem] text-ink-40">
          {round.questions.length} {round.questions.length === 1 ? 'question' : 'questions'}
        </p>
        <button
          type="button"
          onClick={() => setStage({ at: 'question', round: stage.round, index: 0 })}
          className={button}
        >
          Go
        </button>
      </Card>
    )
  }

  if (stage.at === 'question') {
    const round = spec.rounds[stage.round]
    const question = round.questions[stage.index]
    const done = offsetOf(stage.round) + stage.index
    return (
      <Card wide={question.kind === 'rank' || question.kind === 'multi'}>
        <Progress done={done} total={total} />
        <div className="mt-9">
          <Ask
            question={question}
            value={answers[question.id]}
            onChange={(value) => set(question.id, value)}
            onToggle={(option, limit) => toggle(question.id, option, limit)}
          />
        </div>
        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            disabled={!answered(question)}
            onClick={() => advance(stage.round, stage.index)}
            className={button}
          >
            {stage.index + 1 === round.questions.length ? 'Finish the round' : 'Next'}
          </button>
          {question.kind === 'text' && question.optional && !answered(question) && (
            <button
              type="button"
              onClick={() => advance(stage.round, stage.index)}
              className="text-[0.875rem] text-ink-40 underline underline-offset-4 hover:text-ink"
            >
              Skip
            </button>
          )}
        </div>
      </Card>
    )
  }

  if (stage.at === 'between') {
    const round = spec.rounds[stage.round]
    return (
      <Card>
        <Progress done={offsetOf(stage.round) + round.questions.length} total={total} />
        <div className="mt-10">
          {round.interstitial && (
            <Between piece={round.interstitial} answers={answers} previous={previous} />
          )}
        </div>
        {problem && <p className="mt-6 text-[0.875rem] text-flame">{problem}</p>}
        <button type="button" onClick={() => nextRound(stage.round)} className={button}>
          {stage.round + 1 < spec.rounds.length ? 'Keep going' : 'See where that leaves you'}
        </button>
      </Card>
    )
  }

  if (stage.at === 'sending') {
    return (
      <Card fill>
        <Working baseline={spec.slug === 'baseline'} />
      </Card>
    )
  }

  return (
    <Result
      spec={spec}
      answers={answers}
      previous={previous}
      welcomeCall={welcomeCall}
      preview={example}
    />
  )
}

/* ------------------------------------------------------------------ asking */

function Ask({
  question,
  value,
  onChange,
  onToggle,
}: {
  question: Question
  value: number | string | string[] | undefined
  onChange: (value: number | string | string[]) => void
  /** Adding or removing one pick, for the questions that take several. */
  onToggle: (option: string, limit: number) => void
}) {
  const heading = (
    <>
      <h2 className="text-[1.375rem] leading-snug font-medium tracking-[-0.015em]">
        {question.text}
      </h2>
      {'help' in question && question.help && (
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-56">{question.help}</p>
      )}
    </>
  )

  if (question.kind === 'scale') {
    return (
      <>
        {heading}
        <Points
          value={typeof value === 'number' ? value : null}
          onChange={onChange}
          low={question.low}
          high={question.high}
          label={question.text}
        />
      </>
    )
  }

  if (question.kind === 'choice') {
    return (
      <>
        {heading}
        <div className="mt-8 space-y-2.5" role="radiogroup" aria-label={question.text}>
          {question.options.map((option) => (
            <Option
              key={option}
              label={option}
              picked={value === option}
              onClick={() => onChange(option)}
            />
          ))}
        </div>
      </>
    )
  }

  if (question.kind === 'multi' || question.kind === 'rank') {
    const picked = Array.isArray(value) ? value : []
    const full = picked.length >= question.limit
    return (
      <>
        {heading}
        <p className="mt-4 font-mono text-[0.6875rem] tracking-[0.1em] text-ink-40 uppercase">
          {picked.length} of {question.limit} chosen
        </p>
        <div className="mt-5 space-y-2.5">
          {question.options.map((option) => {
            const place = picked.indexOf(option)
            const on = place > -1
            return (
              <Option
                key={option}
                label={option}
                picked={on}
                /* Ranked picks carry the order they were tapped in, which is
                   the ranking. Untapping one closes the gap behind it. */
                rank={question.kind === 'rank' && on ? place + 1 : undefined}
                disabled={!on && full}
                onClick={() => onToggle(option, question.limit)}
              />
            )
          })}
        </div>
      </>
    )
  }

  if (question.kind === 'score') {
    return (
      <>
        {heading}
        <div className="mt-8 flex flex-wrap gap-1.5" role="radiogroup" aria-label={question.text}>
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              onClick={() => onChange(n)}
              className={`h-11 w-11 border text-[0.9375rem] transition-colors ${
                value === n
                  ? 'border-ink bg-ink text-surface'
                  : 'border-line text-ink-56 hover:border-line-strong hover:text-ink'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[0.8125rem] text-ink-40">
          <span>{question.lowLabel}</span>
          <span>{question.highLabel}</span>
        </div>
      </>
    )
  }

  return (
    <>
      {heading}
      <textarea
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder}
        rows={question.length === 'long' ? 7 : 3}
        className="mt-7 w-full resize-none border border-line bg-bg px-4 py-3.5 text-[1.0625rem] leading-relaxed outline-none focus:border-line-strong"
      />
    </>
  )
}

function Option({
  label,
  picked,
  rank,
  disabled,
  onClick,
}: {
  label: string
  picked: boolean
  rank?: number
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={picked}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3.5 border px-4 py-3.5 text-left text-[0.9375rem] leading-snug transition-colors ${
        picked
          ? 'border-accent bg-accent-soft text-ink'
          : disabled
            ? 'border-line text-ink-20'
            : 'border-line text-ink-72 hover:border-line-strong hover:text-ink'
      }`}
    >
      <span
        aria-hidden
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[0.6875rem] ${
          picked ? 'border-accent bg-accent text-surface' : 'border-line-strong'
        }`}
      >
        {picked ? (rank ?? '✓') : ''}
      </span>
      {label}
    </button>
  )
}

/* ------------------------------------------------------- between the rounds */

function Between({
  piece,
  answers,
  previous,
}: {
  piece: Interstitial
  answers: Answers
  previous: Record<string, number> | null
}) {
  if (piece.kind === 'stat') {
    return (
      <div>
        <p className="font-caption text-[4rem] leading-[0.85] font-bold text-ink">
          {piece.figure}
        </p>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink">{piece.of}</p>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-56">{piece.note}</p>
      </div>
    )
  }

  if (piece.kind === 'quote') {
    const obstacles = Array.isArray(answers.obstacles) ? answers.obstacles : []
    const pain: Testimonial['pain'] | undefined =
      piece.pain === 'matched' ? painFor(obstacles) : piece.pain
    const quotes = testimonialsFor(pain, 2)
    return (
      <div>
        <Eyebrow>People who were here</Eyebrow>
        <div className="mt-6 space-y-8">
          {quotes.map((quote) => (
            <figure key={quote.quote}>
              <blockquote className="bg-ink-3 p-5 text-[1.0625rem] leading-relaxed text-ink-72">
                {quote.quote}
              </blockquote>
              <figcaption className="mt-3 text-[0.8125rem] text-ink-40">
                {quote.who}, {quote.where}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    )
  }

  /* A readback: their own answer, or their own movement, shown straight back. */
  if (piece.from === '__delta__') {
    const moves = previous ? movement(previous, spineScores(answers as Record<string, unknown>)) : []
    const best = biggestMove(moves)
    return (
      <div>
        <Eyebrow>{piece.frame}</Eyebrow>
        {best && best.change > 0 ? (
          <>
            <p className="mt-6 font-caption text-[3.5rem] leading-[0.85] font-bold">
              {best.before} <span className="text-ink-20">to</span> {best.after}
            </p>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-72">
              {best.domain} moved further than anything else. That is your own number against your
              own number, sixteen weeks apart.
            </p>
          </>
        ) : moves.length ? (
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink-72">
            Your scores have held rather than climbed. That is worth knowing honestly, and it is
            worth saying so in the next three questions.
          </p>
        ) : (
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink-72">
            There is no baseline on file to set this against, so these are simply where you are
            now. The writing that follows is the part that matters most anyway.
          </p>
        )}
      </div>
    )
  }

  const said = answers[piece.from]
  if (typeof said !== 'string' || !said.trim()) return null
  return (
    <div>
      <Eyebrow>{piece.frame}</Eyebrow>
      <blockquote className="mt-6 bg-ink-3 p-6 text-[1.25rem] leading-relaxed text-ink">
        {said.trim()}
      </blockquote>
    </div>
  )
}

/* ------------------------------------------------------------------ results */

function Result({
  spec,
  answers,
  previous,
  welcomeCall,
  preview,
}: {
  spec: Spec
  answers: Answers
  previous: Record<string, number> | null
  welcomeCall: string | null
  preview: boolean
}) {
  const scores = spineScores(answers as Record<string, unknown>)
  const moves = previous ? movement(previous, scores) : []
  const baseline = spec.slug === 'baseline'

  const priorities = Array.isArray(answers.priorities) ? answers.priorities : []
  const obstacles = Array.isArray(answers.obstacles) ? answers.obstacles : []
  const quotes = testimonialsFor(painFor(obstacles), 2)

  return (
    <Wide>
      <h1 className="font-caption text-[2.75rem] leading-[0.9] font-bold tracking-[-0.01em] uppercase">
        {baseline ? 'Where you are starting from' : moves.length ? 'What moved' : 'Where you are now'}
      </h1>
      <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-72">
        {baseline
          ? 'You answer these same six questions again in week sixteen. The difference between the two is the thing worth looking at.'
          : moves.length
            ? 'Your week one answers, against the ones you have just given.'
            : 'There is no week one on file to compare these against, so these are just where you are.'}
      </p>

      <Section title={baseline ? 'Where you are' : 'Week one to now'} />
      {moves.length ? <Moved moves={moves} /> : <Levels scores={scores} />}

      {baseline && priorities.length > 0 && (
        <>
          <Section title="What you are here for" />
          <ol className="mt-6 space-y-3.5">
            {priorities.map((priority, index) => (
              <li key={priority} className="flex gap-4">
                <span className="font-caption text-[1.5rem] leading-none font-bold text-ink">
                  {index + 1}
                </span>
                <span className="text-[1.0625rem] leading-snug text-ink-72">{priority}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {baseline && typeof answers.sharpest === 'string' && (
        <>
          <Section title="Your window" />
          {/* Two windows or one. Somebody whose sharpest and most drained hours
              are the same gets one sentence, not a sentence about "the second"
              with nothing to point at. */}
          {typeof answers.drained === 'string' && answers.drained !== answers.sharpest ? (
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink-72">
              Your thinking is sharpest {lower(answers.sharpest)}, and you are most drained{' '}
              {lower(answers.drained)}. Put the work that decides your week in the first of those,
              and stop defending the second.
            </p>
          ) : (
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink-72">
              Your thinking is sharpest {lower(answers.sharpest)}. Put the work that decides your
              week there, and guard it before anything else gets to claim it.
            </p>
          )}
        </>
      )}

      {baseline && typeof answers.worth === 'string' && answers.worth.trim() && (
        <>
          <Section title="In your words" />
          <blockquote className="mt-6 bg-ink-3 p-6 text-[1.25rem] leading-relaxed text-ink">
            {answers.worth.trim()}
          </blockquote>
        </>
      )}

      {!baseline && typeof answers.advice === 'string' && answers.advice.trim() && (
        <>
          <Section title="What you would tell them" />
          <blockquote className="mt-6 bg-ink-3 p-6 text-[1.25rem] leading-relaxed text-ink">
            {answers.advice.trim()}
          </blockquote>
        </>
      )}

      {baseline && quotes.length > 0 && (
        <>
          <Section title="Where this goes" />
          <div className="mt-6 space-y-8">
            {quotes.map((quote) => (
              <figure key={quote.quote}>
                <blockquote className="bg-ink-3 p-5 text-[1.0625rem] leading-relaxed text-ink-72">
                  {quote.quote}
                </blockquote>
                <figcaption className="mt-3 text-[0.8125rem] text-ink-40">
                  {quote.who}, {quote.where}
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      {baseline && welcomeCall && (
        <div className="mt-12 border border-accent bg-accent-soft p-6 sm:p-8">
          <h2 className="font-caption text-[1.75rem] leading-[1] font-bold uppercase">
            Book your welcome call
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-72">
            Chris reads this before you speak. Forty five minutes on where you are starting from and
            what the sixteen weeks are for.
          </p>
          <a href={welcomeCall} target="_blank" rel="noreferrer" className={`${button} inline-block`}>
            Pick a time
          </a>
        </div>
      )}

      {baseline && !welcomeCall && (
        <div className="mt-12 border border-line p-6 sm:p-8">
          <h2 className="font-caption text-[1.75rem] leading-[1] font-bold uppercase">
            Start chapter one
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-72">
            Know Thyself. It is the one everything else is built on.
          </p>
          <a href="/week/1" className={`${button} inline-block`}>
            Open week one
          </a>
        </div>
      )}

      <p className="mt-8 text-[0.875rem] leading-relaxed text-ink-40">
        {preview
          ? 'Example answers, so this page can be read without filling it in. Nothing here belongs to anybody and nothing was saved.'
          : 'Saved to your profile. Chris can see it, and so can you, from your dashboard.'}
      </p>
    </Wide>
  )
}

function Moved({ moves }: { moves: Movement[] }) {
  return (
    <ul className="mt-7 space-y-7">
      {moves.map((move) => {
        const up = move.change > 0
        const from = Math.min(move.before, move.after)
        const width = Math.abs(move.change)
        return (
          <li key={move.domain}>
            <div className="flex items-baseline justify-between">
              <span className="text-[1rem] font-medium">{move.domain}</span>
              <span className="font-mono text-[0.875rem] text-ink-56">
                {move.before} <span className="text-ink-20">to</span>{' '}
                <span className="text-ink">{move.after}</span>
                <span className={up ? 'ml-2 text-ink' : 'ml-2 text-ink-40'}>
                  {up ? '+' : ''}
                  {move.change}
                </span>
              </span>
            </div>
            <div className="relative mt-2.5 h-2 w-full bg-ink-5">
              {/* the stretch between the two readings, drawn where it happened */}
              <div
                className={up ? 'absolute h-2 bg-accent' : 'absolute h-2 bg-ink-20'}
                style={{ left: `${from}%`, width: `${Math.max(width, 0.6)}%` }}
              />
              <div
                className="absolute h-2 w-0.5 bg-ink"
                style={{ left: `${move.after}%` }}
                aria-hidden
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Levels({ scores }: { scores: Record<string, number> }) {
  return (
    <ul className="mt-7 space-y-6">
      {DOMAINS.filter((domain) => domain in scores).map((domain) => (
        <li key={domain}>
          <div className="flex items-baseline justify-between">
            <span className="text-[1rem] font-medium">{domain}</span>
            <span className="font-mono text-[0.875rem] text-ink-56">{scores[domain]}</span>
          </div>
          <div className="mt-2.5 h-2 w-full bg-ink-5">
            <div className="h-2 bg-accent" style={{ width: `${scores[domain]}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------- pieces */

const WORKING_MS = 2600

function Working({ baseline }: { baseline: boolean }) {
  const steps = useMemo(
    () =>
      baseline
        ? ['Saving your answers', 'Setting your line', 'Finding what fits', 'Writing it up']
        : ['Saving your answers', 'Finding your baseline', 'Working out the distance', 'Writing it up'],
    [baseline],
  )
  const [at, setAt] = useState(0)
  const ticking = useRef(0)

  useEffect(() => {
    ticking.current = window.setInterval(
      () => setAt((step) => Math.min(step + 1, steps.length - 1)),
      WORKING_MS / steps.length,
    )
    return () => window.clearInterval(ticking.current)
  }, [steps.length])

  return (
    <div>
      <h1 className="font-caption text-[1.75rem] leading-[1] font-bold uppercase">Working it out</h1>
      <div className="mt-6 h-px w-full bg-line">
        <div
          className="h-px bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${Math.round(((at + 1) / steps.length) * 100)}%` }}
        />
      </div>
      <ol className="mt-8 space-y-4" aria-live="polite">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 shrink-0 ${
                index < at ? 'bg-ink' : index === at ? 'animate-pulse bg-accent' : 'bg-ink-12'
              }`}
            />
            <span
              className={`text-[0.9375rem] ${
                index < at ? 'text-ink-40' : index === at ? 'text-ink' : 'text-ink-20'
              }`}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Progress({ done, total }: { done: number; total: number }) {
  const through = Math.round((done / total) * 100)
  return (
    <div>
      <div className="h-px w-full bg-line">
        <div
          className="h-px bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${through}%` }}
        />
      </div>
      <p className="mt-2.5 font-mono text-[0.6875rem] tracking-[0.1em] text-ink-40 uppercase">
        {done} of {total}
      </p>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-ink-40 uppercase">{children}</p>
  )
}

function Section({ title }: { title: string }) {
  return (
    <h2 className="mt-14 border-t border-line pt-6 font-mono text-[0.6875rem] tracking-[0.12em] text-ink-40 uppercase">
      {title}
    </h2>
  )
}

/** Lower-cases a time band for use mid-sentence, keeping any am or pm. */
function lower(band: string): string {
  return band.charAt(0).toLowerCase() + band.slice(1)
}

const button =
  'mt-10 bg-ink px-7 py-4 text-[0.9375rem] font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-25'

function Card({ children, fill, wide }: { children: React.ReactNode; fill?: boolean; wide?: boolean }) {
  return (
    <main className="flex min-h-[100dvh] items-start justify-center bg-bg px-5 py-10 sm:px-6 sm:py-16">
      <div
        className={`w-full border border-line bg-surface p-6 sm:p-10 ${wide ? 'max-w-xl' : 'max-w-lg'} ${
          fill ? 'min-h-[22rem]' : ''
        }`}
      >
        {children}
      </div>
    </main>
  )
}

function Wide({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] items-start justify-center bg-bg px-5 py-10 sm:px-6 sm:py-16">
      <div
        className="w-full max-w-xl border border-line bg-surface p-6 sm:p-10"
        style={{ backgroundImage: "url('/know-thyself/paper.png')", backgroundSize: '256px 256px' }}
      >
        {children}
      </div>
    </main>
  )
}

/**
 * Made-up answers, for looking at a finished result without filling one in.
 *
 * Same purpose as the preview on the printed assessments: a page that can be
 * reviewed, or shown to a cohort, without forty questions first and without
 * writing a fake result to a real profile.
 */
const EXAMPLE: Answers = {
  /* Read as the baseline on the baseline page, and as the week sixteen
     reading on the reflection, where page.tsx supplies the lower start. */
  performance: 83,
  clarity: 67,
  energy: 67,
  resilience: 67,
  alignment: 50,
  fulfilment: 83,
  energised: 'Early morning, 5am to 8am',
  sharpest: 'Mid morning, 8am to 11am',
  drained: 'Afternoon, 2pm to 5pm',
  priorities: [
    'Mental clarity and focus',
    'Handling pressure without it costing me',
    'Time spent the way I would choose',
  ],
  obstacles: ['I overthink until the moment passes', 'I have systems, they just do not stick'],
  pattern:
    'I plan the week properly on a Sunday and by Tuesday afternoon I am back to answering whatever is loudest. Then I work late to catch up on the thing I had actually planned to do, and the week ends with me tired and behind on the one piece of work that mattered.',
  hours: 'Two to four hours',
  worth:
    'It will have been worth it if I stop finishing weeks with the important thing still untouched, and if the people at home get a version of me that is not half gone.',
  insight:
    'That I was treating recovery as the reward for finishing, which meant I never got any, because the work is never finished.',
  win: 'I moved the two hours that decide my week to first thing on a Tuesday and told the team I am not available then. I have kept it for eleven weeks.',
  breakthrough:
    'I used to think being the person who absorbs everything was the job. It was just the version of the job I was willing to do without asking anyone for anything.',
  advice:
    'Do the journal even on the days you think you have nothing to write. Those are the entries I went back and read.',
  valuable: ['The physical journal', 'The drop-in calls', 'The weekly digests'],
  recommend: 9,
}
