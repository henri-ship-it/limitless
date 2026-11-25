'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { finishTour } from '@/app/actions'
import { TOUR, type Stop } from '@/content/tour'

/**
 * The walk round the platform, shown once after somebody sets their baseline.
 *
 * Built as coachmarks rather than as a carousel of screenshots: a ring round
 * the real thing on the real page, and a card beside it saying what it is.
 * Somebody who has been shown where the journal is on the actual journal
 * button can find it again. A slideshow of pictures of the platform teaches
 * the slideshow.
 *
 * Every stop names an element by `data-tour`. A stop whose element is not on
 * this page, or is hidden because the sidebar is collapsed on a phone, is
 * skipped rather than pointed at empty space.
 */

type Box = { top: number; left: number; width: number; height: number }

export function Tour({ firstName }: { firstName: string | null }) {
  const [at, setAt] = useState(-1)
  const [box, setBox] = useState<Box | null>(null)
  const [gone, setGone] = useState(false)
  const card = useRef<HTMLDivElement>(null)

  /** The stops whose targets actually exist here. */
  const [stops, setStops] = useState<Stop[]>([])

  useEffect(() => {
    setStops(TOUR.filter((stop) => document.querySelector(`[data-tour="${stop.target}"]`)))
  }, [])

  const measure = useCallback(() => {
    if (at < 0 || at >= stops.length) return setBox(null)
    const target = document.querySelector(`[data-tour="${stops[at].target}"]`)
    if (!target) return setBox(null)
    const rect = target.getBoundingClientRect()
    setBox({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    })
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [at, stops])

  useLayoutEffect(measure, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  function close() {
    setGone(true)
    void finishTour()
  }

  if (gone || !stops.length) return null

  /* The opening card, before any element is pointed at. */
  if (at === -1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md border border-line bg-surface p-7">
          <h2 className="font-caption text-[2rem] leading-[0.95] font-bold uppercase">
            {firstName ? `Right ${firstName}, here is the place` : 'Here is the place'}
          </h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-72">
            Six quick stops, about a minute. You can stop at any point, and it is in your account
            if you want it again.
          </p>
          <div className="mt-7 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setAt(0)}
              className="bg-ink py-3.5 text-[0.9375rem] font-medium text-surface transition-opacity hover:opacity-90"
            >
              Show me round
            </button>
            <button
              type="button"
              onClick={close}
              className="py-3 text-[0.9375rem] text-ink-56 transition-colors hover:text-ink"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stop = stops[at]
  const last = at === stops.length - 1

  /*
   * Which side of the target the card sits on. Below unless the target is in
   * the bottom half of the window, which is where the sidebar's lower items
   * and the tab bar live.
   */
  const below = !box || box.top - window.scrollY < window.innerHeight / 2

  return (
    <>
      {/* The ring. Nothing is masked out: dimming the whole page and cutting a
          hole in it looks impressive and makes the thing being pointed at
          harder to see, not easier. */}
      {box && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-40 rounded-[14px] ring-2 ring-accent transition-all duration-300"
          style={{
            top: box.top - 6,
            left: box.left - 6,
            width: box.width + 12,
            height: box.height + 12,
          }}
        />
      )}

      <div
        ref={card}
        role="dialog"
        aria-live="polite"
        aria-label={stop.title}
        className="fixed inset-x-4 z-50 mx-auto max-w-sm border border-line bg-surface p-5 shadow-[0_8px_40px_rgba(0,0,0,0.14)] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        style={
          below
            ? { top: Math.min((box?.top ?? 0) - window.scrollY + (box?.height ?? 0) + 16, window.innerHeight - 220) }
            : { bottom: Math.min(window.innerHeight - (box?.top ?? 0) + window.scrollY + 16, window.innerHeight - 220) }
        }
      >
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[0.6875rem] tracking-[0.1em] text-ink-40 uppercase">
            {at + 1} of {stops.length}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close the walkthrough"
            className="-mt-1 -mr-1 p-1 text-ink-40 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <h3 className="mt-2.5 font-caption text-[1.25rem] leading-tight font-bold uppercase">
          {stop.title}
        </h3>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-72">{stop.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setAt((n) => Math.max(0, n - 1))}
            disabled={at === 0}
            className="text-[0.875rem] text-ink-56 transition-colors hover:text-ink disabled:opacity-0"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => (last ? close() : setAt((n) => n + 1))}
            className="bg-ink px-5 py-2.5 text-[0.875rem] font-medium text-surface transition-opacity hover:opacity-90"
          >
            {last ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </>
  )
}
