'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Speaks into a field instead of typing.
 *
 * This uses the recognition built into the browser rather than sending audio
 * anywhere, so it costs nothing, needs no key, and the words never leave the
 * device. Safari and Chrome have it. Firefox does not, and there the button
 * simply does not appear.
 *
 * The bars are a real reading of the microphone, not a decoration: without
 * them there is no way to tell the difference between listening and a dead
 * microphone.
 */
export function Dictate({ onText }: { onText: (text: string) => void }) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [levels, setLevels] = useState<number[]>([0, 0, 0, 0, 0])

  const recognition = useRef<any>(null)
  const audio = useRef<{ ctx: AudioContext; stream: MediaStream; frame: number } | null>(null)

  /*
   * The callback lives in a ref so the recogniser is built once. Held in the
   * dependency array it was rebuilt on every keystroke, which stopped it
   * mid-sentence: the parent passes a new function on each render.
   */
  const handler = useRef(onText)
  handler.current = onText

  useEffect(() => {
    const Recognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!Recognition) return

    setSupported(true)
    const r = new Recognition()
    r.lang = 'en-GB'
    r.continuous = true
    r.interimResults = false

    r.onresult = (event: any) => {
      let said = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) said += event.results[i][0].transcript
      }
      said = said.trim()
      if (said) handler.current(said)
    }
    r.onend = () => {
      setListening(false)
      stopMeter()
    }
    r.onerror = () => {
      setListening(false)
      stopMeter()
    }

    recognition.current = r

    return () => {
      r.onresult = null
      r.onend = null
      r.onerror = null
      try {
        r.stop()
      } catch {
        // Already stopped.
      }
      stopMeter()
    }
  }, [])

  function stopMeter() {
    const a = audio.current
    if (!a) return
    cancelAnimationFrame(a.frame)
    for (const track of a.stream.getTracks()) track.stop()
    void a.ctx.close()
    audio.current = null
    setLevels([0, 0, 0, 0, 0])
  }

  async function startMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)

      const bins = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(bins)
        // Five bars across the low end, where speech sits.
        const next = [0, 1, 2, 3, 4].map((i) => {
          const from = Math.floor((bins.length / 3 / 5) * i)
          const to = Math.floor((bins.length / 3 / 5) * (i + 1))
          let sum = 0
          for (let j = from; j < to; j += 1) sum += bins[j]
          return Math.min(1, sum / (to - from) / 140)
        })
        setLevels(next)
        if (audio.current) audio.current.frame = requestAnimationFrame(tick)
      }

      audio.current = { ctx, stream, frame: requestAnimationFrame(tick) }
    } catch {
      // No microphone, or permission refused. Recognition may still work, and
      // the bars simply stay flat.
    }
  }

  if (!supported) return null

  function toggle() {
    const r = recognition.current
    if (!r) return

    if (listening) {
      try {
        r.stop()
      } catch {
        // Already stopped.
      }
      setListening(false)
      stopMeter()
      return
    }

    try {
      r.start()
      setListening(true)
      void startMeter()
    } catch {
      // Already running.
    }
  }

  return (
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
  )
}
