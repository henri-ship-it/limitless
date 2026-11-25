'use client'

import { useEffect, useState } from 'react'

import { POINTS, WENT_WELL, opener, question, type Pulse as Spec } from '@/content/pulse'

/**
 * The module check-in, as a sheet that comes up from the bottom of the week.
 *
 * A sheet rather than a modal on purpose. A modal that has to be dealt with
 * before the page can be used buys a higher response rate and costs goodwill,
 * and this runs four times over sixteen weeks against the same person. This
 * sits over the corner of the page, can be ignored, and is gone for good once
 * it is dismissed.
 *
 * It opens on one question with five taps under it. Answering it finishes the
 * ask: the score is saved on that tap, and everything after is offered rather
 * than required. Somebody who taps once and closes the tab has still given us
 * the number.
 */

type Stage = 'score' | 'more' | 'done'

export function Pulse({ spec, firstName }: { spec: Spec; firstName: string | null }) {
  const [shown, setShown] = useState(false)
  const [stage, setStage] = useState<Stage>('score')
  const [score, setScore] = useState<number | null>(null)
  const [chapter, setChapter] = useState<string | null>(null)
  const [words, setWords] = useState('')
  const [saving, setSaving] = useState(false)

  /* A beat before it appears, so it reads as arriving rather than as part of
     the page somebody just loaded. */
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 900)
    return () => window.clearTimeout(id)
  }, [])

  async function save(patch: Record<string, unknown>, done: boolean) {
    setSaving(true)
    try {
      await fetch(`/api/pulse/${spec.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...patch, dismissed: done }),
      })
    } catch {
      /* A check-in is not worth an error message. The score is already on
         screen as answered, and a failed save costs one data point. */
    } finally {
      setSaving(false)
    }
  }

  function pick(value: number) {
    setScore(value)
    setStage('more')
    void save({ score: value }, false)
  }

  function finish() {
    setStage('done')
    void save(
      { score, chapter, words: words.trim().slice(0, 2000) },
      true,
    )
    window.setTimeout(() => setShown(false), 2600)
  }

  function close() {
    setShown(false)
    // Dismissing counts as an answer to "do not ask me again this week".
    void save({ score, dismissed: true }, true)
  }

  if (!shown) return null

  const well = (score ?? 0) >= WENT_WELL

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:px-0 sm:pb-0">
      <div className="w-full max-w-sm border border-line bg-surface p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[0.6875rem] tracking-[0.1em] text-ink-40 uppercase">
            Check-in {spec.nth} of 4
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close the check-in"
            className="-mt-1 -mr-1 p-1 text-ink-40 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {stage === 'score' && (
          <>
            <p className="mt-3 text-[1.0625rem] leading-snug font-medium">
              {opener(spec)} {question(spec)}
            </p>
            <div className="mt-5 flex gap-1.5" role="radiogroup" aria-label="How much changed">
              {POINTS.map((point) => (
                <button
                  key={point.value}
                  type="button"
                  role="radio"
                  aria-checked={false}
                  aria-label={point.label}
                  onClick={() => pick(point.value)}
                  className="flex-1 border border-line py-3 text-[0.8125rem] text-ink-56 transition-colors hover:border-accent hover:bg-accent-soft hover:text-ink"
                >
                  {point.value}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[0.75rem] text-ink-40">
              <span>{POINTS[0].label}</span>
              <span>{POINTS[POINTS.length - 1].label}</span>
            </div>
          </>
        )}

        {stage === 'more' && (
          <>
            <p className="mt-3 text-[1.0625rem] leading-snug font-medium">
              {well ? 'What landed?' : 'What was missing?'}
            </p>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-56">
              Saved already. This bit is optional.
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {/* Nothing to pick on the year long journal: a chapter there is
                  a month of its own, so the check-in is already about one. */}
              {spec.chapters.map((item) => (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => setChapter(chapter === item.title ? null : item.title)}
                  className={`border px-3 py-1.5 text-[0.8125rem] transition-colors ${
                    chapter === item.title
                      ? 'border-accent bg-accent-soft text-ink'
                      : 'border-line text-ink-56 hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <textarea
              value={words}
              onChange={(event) => setWords(event.target.value)}
              rows={3}
              placeholder={well ? 'Which part made the difference' : 'What would have helped'}
              className="mt-3 w-full resize-none border border-line bg-bg px-3 py-2.5 text-[0.9375rem] leading-relaxed outline-none focus:border-line-strong"
            />

            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="mt-3 w-full bg-ink py-3 text-[0.875rem] font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {words.trim() || chapter ? 'Send it' : 'Done'}
            </button>
          </>
        )}

        {stage === 'done' && (
          <p className="mt-3 text-[1.0625rem] leading-snug font-medium">
            {spec.nth === 4
              ? `That is all four${firstName ? `, ${firstName}` : ''}. Chris reads every one.`
              : `Got it${firstName ? `, ${firstName}` : ''}. ${4 - spec.nth} to go.`}
          </p>
        )}
      </div>
    </div>
  )
}
