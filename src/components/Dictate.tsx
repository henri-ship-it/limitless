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
 * Text is appended rather than replacing what is there, so dictating twice
 * adds to the entry instead of wiping it.
 */
export function Dictate({ onText }: { onText: (text: string) => void }) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recognition = useRef<any>(null)

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
      if (said.trim()) onText(said.trim())
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)

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
    }
  }, [onText])

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={() => {
        const r = recognition.current
        if (!r) return
        if (listening) {
          r.stop()
          setListening(false)
        } else {
          try {
            r.start()
            setListening(true)
          } catch {
            // Already running.
          }
        }
      }}
      aria-pressed={listening}
      aria-label={listening ? 'Stop dictating' : 'Dictate this answer'}
      className={`label flex shrink-0 items-center gap-1.5 border px-2.5 py-1 transition-colors ${
        listening
          ? 'border-accent-ink bg-accent-soft !text-ink'
          : 'border-line hover:border-ink hover:!text-ink'
      }`}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
        <rect x="4.25" y="1.25" width="3.5" height="6" rx="1.75" />
        <path d="M2.5 6a3.5 3.5 0 0 0 7 0M6 9.5v1.25" strokeLinecap="round" />
      </svg>
      {listening ? 'Listening' : 'Speak'}
    </button>
  )
}
