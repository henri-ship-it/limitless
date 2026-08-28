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
 * Every button on the page shares one recogniser, because the browser only
 * allows one session at a time. Tapping a second field takes over from the
 * first rather than failing silently.
 *
 * The bars read the actual microphone level. Without them there is no way to
 * tell listening from a dead microphone.
 */
export function Dictate({ onText }: { onText: (text: string) => void }) {
  const id = useId()
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [levels, setLevels] = useState<number[]>([0, 0, 0, 0, 0])
  const [problem, setProblem] = useState<string | null>(null)

  const audio = useRef<{ ctx: AudioContext; stream: MediaStream; frame: number } | null>(null)
  const meterOn = useRef(false)

  // Held in a ref so the button never has to be rebuilt to pick up a new one.
  const handler = useRef(onText)
  handler.current = onText

  useEffect(() => {
    setSupported(speechSupported())
    return () => {
      stopMeter()
    }
  }, [])

  function stopMeter() {
    meterOn.current = false
    const a = audio.current
    if (!a) return
    cancelAnimationFrame(a.frame)
    for (const track of a.stream.getTracks()) track.stop()
    void a.ctx.close()
    audio.current = null
    setLevels([0, 0, 0, 0, 0])
  }

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
      const tick = () => {
        analyser.getByteFrequencyData(bins)
        // Five bars across the low end, where speech sits.
        setLevels(
          [0, 1, 2, 3, 4].map((i) => {
            const from = Math.floor((bins.length / 3 / 5) * i)
            const to = Math.floor((bins.length / 3 / 5) * (i + 1))
            let sum = 0
            for (let j = from; j < to; j += 1) sum += bins[j]
            return Math.min(1, sum / (to - from) / 140)
          }),
        )
        if (audio.current) audio.current.frame = requestAnimationFrame(tick)
      }

      audio.current = { ctx, stream, frame: requestAnimationFrame(tick) }
    } catch {
      // No microphone, or permission refused. Recognition may still work and
      // the bars simply stay flat.
    }
  }

  if (!supported) return null

  async function toggle() {
    if (listening) {
      await stopSpeech()
      setListening(false)
      stopMeter()
      return
    }

    setProblem(null)
    const started = await startSpeech(id, {
      onText: (said) => handler.current(said),
      // Fires when this session ends for any reason, including another field
      // taking over or iOS stopping after a pause.
      onStop: (reason) => {
        setListening(false)
        stopMeter()
        setProblem(speechProblem(reason))
      },
    })

    if (started) {
      setListening(true)
      void startMeter()
    } else {
      setProblem('Dictation could not start. Another field may still be listening.')
    }
  }

  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      aria-label={listening ? 'Stop dictating' : 'Dictate this answer'}
      className={`label flex shrink-0 items-center gap-2 border px-2.5 py-1 transition-colors ${
        listening
          ? 'border-accent-ink bg-accent-soft !text-ink'
          : 'border-line hover:border-ink hover:!text-ink'
      }`}
    >
      {listening ? (
        <span className="flex h-3.5 items-center gap-[2px]" aria-hidden>
          {levels.map((level, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-accent-ink transition-[height] duration-75"
              style={{ height: `${Math.max(15, level * 100)}%` }}
            />
          ))}
        </span>
      ) : (
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
      )}
      {listening ? 'Listening' : 'Speak'}
      </button>
      {problem ? (
        <span className="max-w-[14rem] text-right text-[0.6875rem] leading-snug text-ink-56">
          {problem}
        </span>
      ) : null}
    </span>
  )
}
