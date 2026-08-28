'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { speechProblem, speechSupported, startSpeech, stopSpeech } from '@/lib/speech'

/**
 * Speaks into a field instead of typing.
 *
 * Recognition happens in the browser rather than being sent anywhere, so it
 * costs nothing, needs no key, and the words never leave the device. Safari and
 * Chrome have it. Firefox does not, and there the button does not appear.
 *
 * The words are held here until they are accepted, rather than being typed
 * straight into the entry. That is the whole difference: you can see what was
 * heard, keep talking, and throw the lot away if it came out as nonsense,
 * instead of watching a half heard sentence land in your journal.
 *
 * Every button on the page shares one recogniser, because the browser only
 * allows one session at a time. Tapping a second field takes over from the
 * first rather than failing silently.
 */

/** Bars in the trace. Enough to read as a waveform, few enough to stay cheap. */
const BARS = 34

export function Dictate({ onText, label }: { onText: (text: string) => void; label?: string }) {
  const id = useId()
  const [supported, setSupported] = useState(false)
  const [open, setOpen] = useState(false)
  const [live, setLive] = useState(false)
  const [heard, setHeard] = useState('')
  const [pending, setPending] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [trace, setTrace] = useState<number[]>(() => Array(BARS).fill(0))
  const [problem, setProblem] = useState<string | null>(null)

  const audio = useRef<{ ctx: AudioContext; stream: MediaStream; frame: number } | null>(null)
  const meterOn = useRef(false)
  const handler = useRef(onText)
  handler.current = onText

  useEffect(() => {
    setSupported(speechSupported())
    return () => stopMeter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [live])

  function stopMeter() {
    meterOn.current = false
    const a = audio.current
    if (!a) return
    cancelAnimationFrame(a.frame)
    for (const track of a.stream.getTracks()) track.stop()
    void a.ctx.close()
    audio.current = null
  }

  /**
   * Reads the actual microphone level into a scrolling trace.
   *
   * Without it there is no way to tell listening from a dead microphone, which
   * is the single most common thing to go wrong here.
   */
  async function startMeter() {
    if (audio.current) return
    meterOn.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!meterOn.current) {
        for (const track of stream.getTracks()) track.stop()
        return
      }

      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)

      const bins = new Uint8Array(analyser.frequencyBinCount)
      let last = 0

      const tick = (now: number) => {
        // Sixteen or so a second. Any faster and the trace is a blur.
        if (now - last > 60) {
          last = now
          analyser.getByteFrequencyData(bins)
          let sum = 0
          const speech = Math.floor(bins.length / 3)
          for (let i = 0; i < speech; i += 1) sum += bins[i]
          const level = Math.min(1, sum / speech / 110)
          setTrace((held) => [...held.slice(1), level])
        }
        if (audio.current) audio.current.frame = requestAnimationFrame(tick)
      }

      audio.current = { ctx, stream, frame: requestAnimationFrame(tick) }
    } catch {
      // No microphone, or permission refused. Recognition may still work and
      // the trace simply stays flat.
    }
  }

  function listen() {
    setProblem(null)
    const started = startSpeech(id, {
      onText: (said) => setHeard((held) => (held ? `${held} ${said}` : said)),
      onInterim: setPending,
      onStop: (reason) => {
        setLive(false)
        setPending('')
        stopMeter()
        setProblem(speechProblem(reason))
      },
    })

    if (started) {
      setOpen(true)
      setLive(true)
      void startMeter()
    } else {
      setProblem('Dictation is not available in this browser.')
    }
  }

  function pause() {
    stopSpeech()
    setLive(false)
    stopMeter()
  }

  function close() {
    stopSpeech()
    stopMeter()
    setOpen(false)
    setLive(false)
    setHeard('')
    setPending('')
    setSeconds(0)
    setProblem(null)
    setTrace(Array(BARS).fill(0))
  }

  function accept() {
    const said = `${heard} ${pending}`.trim()
    if (said) handler.current(said)
    close()
  }

  if (!supported) return null

  return (
    <>
      <button
        type="button"
        onClick={listen}
        aria-label={label ? `Dictate: ${label}` : 'Dictate this answer'}
        className="label flex shrink-0 items-center gap-2 border border-line px-2.5 py-1 transition-colors hover:border-ink hover:!text-ink"
      >
        <MicIcon />
        Speak
      </button>

      {open ? (
        <div
          /*
           * Sits over the page rather than inside the field. On a phone the
           * controls end up under your thumb, and there is only ever one of
           * these because the browser only allows one recogniser.
           */
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-surface shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.18)]"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto max-w-[42rem] px-5 pt-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="label !text-ink-56 truncate">{label ?? 'Dictating'}</span>
              <span className="label ml-auto tabular-nums !text-ink-40">{clock(seconds)}</span>
            </div>

            <div className="mb-3 flex h-10 items-center gap-[3px]" aria-hidden>
              {trace.map((level, i) => (
                <span
                  key={i}
                  className={`flex-1 rounded-full transition-[height] duration-100 ${
                    live ? 'bg-accent-ink' : 'bg-ink-20'
                  }`}
                  style={{ height: `${Math.max(8, level * 100)}%` }}
                />
              ))}
            </div>

            <p className="!mb-4 min-h-[3.25rem] text-[0.9375rem] leading-relaxed text-ink">
              {heard || pending ? (
                <>
                  {heard}
                  {pending ? <span className="text-ink-40"> {pending}</span> : null}
                </>
              ) : (
                <span className="!text-ink-40">
                  {live ? 'Listening. Start talking.' : 'Nothing heard yet.'}
                </span>
              )}
            </p>

            {problem ? (
              <p className="!mb-4 text-[0.8125rem] leading-snug !text-ink-56">{problem}</p>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={close}
                className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
              >
                Discard
              </button>

              {live ? (
                <button
                  type="button"
                  onClick={pause}
                  className="label ml-auto border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={listen}
                  className="label ml-auto border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
                >
                  {heard ? 'Keep going' : 'Try again'}
                </button>
              )}

              <button
                type="button"
                onClick={accept}
                disabled={!heard && !pending}
                className="label !text-white bg-ink px-4 py-2.5 hover:bg-ink-72 disabled:opacity-40"
              >
                Add to entry
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function clock(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden
    >
      <rect x="4.25" y="1.25" width="3.5" height="6" rx="1.75" />
      <path d="M2.5 6a3.5 3.5 0 0 0 7 0M6 9.5v1.25" strokeLinecap="round" />
    </svg>
  )
}
