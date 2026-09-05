'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraIcon } from './icons'

/**
 * Photographs a page of the printed journal and reads it into the entry.
 *
 * For the people who write on paper, which from the cohort chats is a good few
 * of them. The guide frame is the whole trick: the shape of the open spread
 * held in the middle of the viewfinder with everything outside it dimmed, so
 * what gets sent is the pages and not the table they are lying on. The crop is
 * real - the frame is measured against the video and cut out of it, rather than
 * drawn on top and hoped for.
 *
 * An entry is a spread, not a page: the day is previewed and reviewed on the
 * left and the exercise worked on the right, so both halves have to be in the
 * shot. Two A5 pages side by side is A4 landscape, so the frame is that shape
 * whichever way the phone is held, and turning it is left to whoever is holding
 * it rather than nagged about - the shape of the hole says it on its own.
 *
 * Nothing is saved without the member seeing it. The transcription lands in
 * their form for them to check against the page still in their hand.
 */

/** An open spread is two A5 pages side by side, which is A4 landscape. */
const SPREAD_RATIO = 297 / 210

/**
 * Long edge of what gets sent. A spread carries two pages of handwriting across
 * it, so it needs more than a single page would to stay legible.
 */
const LONGEST_EDGE = 2200

type Stage = 'closed' | 'starting' | 'framing' | 'captured' | 'reading' | 'problem'

/** What is actually happening, in order, while a page is being read. */
const STAGES = ['Analysing your journal', 'Matching it to the entry', 'Checking the answers']

export function PhotographEntry({
  entry,
  onFilled,
}: {
  entry: number
  onFilled: (data: Record<string, unknown>) => void
}) {
  const [stage, setStage] = useState<Stage>('closed')
  const [problem, setProblem] = useState('')
  const [step, setStep] = useState(0)
  /* The shot itself, held so it can be shown back rather than a black screen. */
  const [shot, setShot] = useState<string | null>(null)
  const video = useRef<HTMLVideoElement | null>(null)
  const frame = useRef<HTMLDivElement>(null)
  const stage_ = useRef<HTMLDivElement>(null)
  const stream = useRef<MediaStream | null>(null)

  /*
   * Attaches the camera the moment the element exists, rather than a frame after
   * asking for it.
   *
   * This used to set srcObject inside a requestAnimationFrame after setting the
   * stage, which is a race: React commits when it is ready, and the frame can
   * arrive first, leaving the ref null and the viewfinder black. It only showed
   * up behind the permission prompt, where the timing differs - cancel and
   * reopen and it worked, which is the tell.
   *
   * A callback ref cannot lose that race. It runs when the node is attached,
   * with the stream already in hand.
   */
  const attach = useCallback((el: HTMLVideoElement | null) => {
    video.current = el
    if (!el || !stream.current) return
    el.srcObject = stream.current
    // Rejects if something interrupts it, which is not worth surfacing.
    void el.play().catch(() => {})
  }, [])

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
  }, [])

  useEffect(() => stop, [stop])

  /*
   * Moves through the stages of the read while it happens. The work really is
   * sequential, so this is a description of it rather than a decoration, but it
   * cannot know how far along it is - hence a pace rather than a percentage.
   */
  useEffect(() => {
    if (stage !== 'reading') return
    setStep(0)
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STAGES.length - 1)), 2600)
    return () => clearInterval(timer)
  }, [stage])

  async function open() {
    setProblem('')
    setStage('starting')
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        // The back camera, and as much detail as it will give us.
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 2400 } },
        audio: false,
      })
      // Held before the stage changes, so it is waiting when the element mounts.
      stream.current = media
      setStage('framing')
    } catch {
      stop()
      setStage('problem')
      setProblem(
        'No camera here, or permission was declined. You can still choose a photo you have already taken.',
      )
    }
  }

  function close() {
    stop()
    if (shot) URL.revokeObjectURL(shot)
    setShot(null)
    setStage('closed')
  }

  /** Cuts the guide frame out of the video, in the video's own pixels. */
  function crop(): Promise<Blob | null> {
    const source = video.current
    const box = frame.current
    const held = stage_.current
    if (!source || !box || !held) return Promise.resolve(null)

    const vw = source.videoWidth
    const vh = source.videoHeight
    const cw = held.clientWidth
    const ch = held.clientHeight

    /*
     * The video is displayed with object-fit: cover, so it is scaled up until
     * it fills the box and the overflow is cut off evenly. Undoing that is what
     * turns a rectangle on screen into a rectangle of the photograph.
     */
    const scale = Math.max(cw / vw, ch / vh)
    const spillX = (vw * scale - cw) / 2
    const spillY = (vh * scale - ch) / 2

    const g = box.getBoundingClientRect()
    const c = held.getBoundingClientRect()
    const sx = (g.left - c.left + spillX) / scale
    const sy = (g.top - c.top + spillY) / scale
    const sw = g.width / scale
    const sh = g.height / scale

    const shrink = Math.min(1, LONGEST_EDGE / Math.max(sw, sh))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(sw * shrink)
    canvas.height = Math.round(sh * shrink)
    canvas.getContext('2d')?.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  }

  async function send(blob: Blob) {
    /*
     * Show the shot back before anything else happens.
     *
     * Going straight from viewfinder to a progress bar left people holding the
     * phone over the page, still trying to keep it steady, with no idea whether
     * it had been taken. The photograph is already on the device by this point:
     * say so, then get on with reading it.
     */
    stop()
    const preview = URL.createObjectURL(blob)
    setShot((old) => {
      if (old) URL.revokeObjectURL(old)
      return preview
    })
    setStage('captured')
    setTimeout(() => setStage((s) => (s === 'captured' ? 'reading' : s)), 1100)

    try {
      const base64 = await asBase64(blob)
      const response = await fetch(`/api/journal/${entry}/read`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: base64, type: 'image/jpeg' }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setProblem(payload.error ?? 'That did not work.')
        setStage('problem')
        return
      }
      onFilled(payload.data ?? {})
      setStage('closed')
    } catch {
      setProblem('Could not send the photo. Check your connection and try again.')
      setStage('problem')
    }
  }

  async function shoot() {
    const blob = await crop()
    if (blob) await send(blob)
  }

  async function chosen(file: File | undefined) {
    if (file) await send(file)
  }

  if (stage === 'closed') {
    return (
      <button
        type="button"
        onClick={open}
        className="label flex items-center gap-2 border border-line px-3 py-1.5 hover:border-ink hover:!text-ink"
      >
        <CameraIcon />
        Photograph your entry
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <span />
        <button type="button" onClick={close} className="label !text-white/60 hover:!text-white">
          Cancel
        </button>
      </div>

      <div ref={stage_} className="relative min-h-0 flex-1 overflow-hidden">
        {stage === 'framing' ? (
          <video
            ref={attach}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        {/* What was actually taken, so the screen is the page rather than black. */}
        {shot && (stage === 'captured' || stage === 'reading') ? (
          <img
            src={shot}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
              stage === 'reading' ? 'opacity-30' : 'opacity-100'
            }`}
          />
        ) : null}

        {/* The frame. Dimmed all round by a very large shadow rather than four
            separate panels, so the hole is always exactly the crop. */}
        <div
          className={`pointer-events-none absolute inset-0 flex-col items-center justify-center p-6 ${
            stage === 'captured' || stage === 'reading' ? 'hidden' : 'flex'
          }`}
        >
          {/*
            Sized by width, capped so the height it implies still fits. A fixed
            height with a max width instead would go out of shape on a phone
            held upright, which is where this will almost always be used.
          */}
          <div
            ref={frame}
            style={{
              aspectRatio: String(SPREAD_RATIO),
              maxWidth: `calc((100dvh - 15rem) * ${SPREAD_RATIO})`,
              boxShadow: '0 0 0 100vmax rgba(0,0,0,0.55)',
            }}
            className="relative w-full rounded-[2px] outline outline-2 outline-white/80"
          >
            <Corner className="left-0 top-0 border-l-2 border-t-2" />
            <Corner className="right-0 top-0 border-r-2 border-t-2" />
            <Corner className="bottom-0 left-0 border-b-2 border-l-2" />
            <Corner className="bottom-0 right-0 border-b-2 border-r-2" />
            {/* The gutter, so the spread is lined up rather than merely inside
                the frame. */}
            <span className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/25" />
            {/* Above the frame rather than in the corner, so it reads as a label
                for the thing being photographed. z-index because the dimming is
                a shadow cast by the frame itself. */}
            <p className="label absolute inset-x-0 -top-7 z-10 text-center !text-white/70">
              Entry {entry}
            </p>
          </div>
        </div>

        {/* Taken. Said plainly, before anything starts working on it. */}
        {stage === 'captured' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 12.5 9.5 18 20 7" />
              </svg>
            </span>
            <p className="label !text-white">Got it</p>
            <p className="text-[0.9375rem] text-white/70">You can put the phone down.</p>
          </div>
        ) : null}

        {stage === 'reading' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
            <p className="label !text-white">{STAGES[step]}</p>
            <div className="h-[3px] w-52 overflow-hidden rounded-full bg-white/15">
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-[2600ms] ease-out"
                style={{ width: `${28 + step * 28}%` }}
              />
            </div>
          </div>
        ) : null}

        {stage === 'starting' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="label !text-white/60">Opening the camera…</p>
          </div>
        ) : null}
      </div>

      {/* The home indicator on a modern phone sits over anything flush to the
          bottom, and the shutter is the one control that must never be under it. */}
      <div
        className="px-6 pt-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        {stage === 'problem' ? (
          <p className="mx-auto !mb-5 max-w-sm text-center text-[0.9375rem] leading-relaxed text-white/80">
            {problem}
          </p>
        ) : (
          <p className="!mb-5 text-center text-[0.8125rem] text-white/50">
            {stage === 'captured' || stage === 'reading'
              ? 'Nothing is saved until you have read it back.'
              : 'Both pages in the frame, spine on the line, flat and evenly lit.'}
          </p>
        )}

        {/* Three columns so the shutter stays dead centre whatever sits either
            side of it, and nothing wraps onto a second line on a narrow phone. */}
        <div className="grid grid-cols-3 items-center">
          <label className="label cursor-pointer whitespace-nowrap !text-white/60 hover:!text-white">
            Choose a photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void chosen(e.target.files?.[0])}
            />
          </label>

          <button
            type="button"
            onClick={shoot}
            disabled={stage !== 'framing'}
            aria-label="Take the photo"
            className="h-16 w-16 justify-self-center rounded-full border-4 border-white/90 bg-white/20 transition-colors hover:bg-white/40 disabled:opacity-30"
          />

          <span className="label justify-self-end whitespace-nowrap !text-white/30">
            {stage === 'reading' ? 'Working' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute h-6 w-6 border-white ${className}`} />
}

function asBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('unreadable'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
}
