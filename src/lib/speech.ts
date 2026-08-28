/**
 * One speech recogniser for the whole page.
 *
 * The browser allows a single recognition session at a time. Building one per
 * field meant the first field to start held the microphone and every other
 * button did nothing, because the failure to start throws quietly.
 *
 * This keeps a single recogniser and routes its results to whichever field is
 * listening. Starting a new field stops the previous one and waits for it to
 * actually finish before starting again, which the browser requires.
 */

type Listener = {
  onText: (text: string) => void
  /** Called when the session ends. `reason` is set only when it failed. */
  onStop: (reason?: string) => void
}

/**
 * What the browser's error codes mean, in words a member can act on. Without
 * this a refused microphone looks identical to a button that does nothing.
 */
export function speechProblem(code?: string): string | null {
  switch (code) {
    case undefined:
    case 'aborted':
      return null
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone blocked. Allow it for this site in your browser settings.'
    case 'no-speech':
      return 'Nothing heard. Try again and speak up.'
    case 'audio-capture':
      return 'No microphone found.'
    case 'network':
      return 'Speech recognition could not reach the network.'
    default:
      return 'Dictation stopped unexpectedly.'
  }
}

let recognition: any = null
let active: string | null = null
let listener: Listener | null = null
let ending: Promise<void> | null = null
let resolveEnding: (() => void) | null = null

export function speechSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
}

function ensure() {
  if (recognition) return recognition

  const Recognition =
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  const r = new Recognition()
  r.lang = 'en-GB'
  // iOS ends a session on its own after a pause whatever this says, so the
  // button reflects what actually happened rather than what was asked for.
  r.continuous = true
  r.interimResults = false

  r.onresult = (event: any) => {
    let said = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      if (event.results[i].isFinal) said += event.results[i][0].transcript
    }
    said = said.trim()
    if (said) listener?.onText(said)
  }

  const finish = (reason?: string) => {
    listener?.onStop(reason)
    listener = null
    active = null
    resolveEnding?.()
    resolveEnding = null
    ending = null
  }

  r.onend = () => finish()
  r.onerror = (event: any) => finish(event?.error ?? 'unknown')

  recognition = r
  return r
}

/** Stops whatever is listening, and resolves once the browser confirms it. */
export async function stopSpeech(): Promise<void> {
  if (!recognition || !active) return
  if (ending) return ending

  ending = new Promise<void>((resolve) => {
    resolveEnding = resolve
  })
  const pending = ending
  try {
    recognition.stop()
  } catch {
    resolveEnding?.()
    resolveEnding = null
    ending = null
  }
  return pending
}

/**
 * Starts listening for one field. Returns false when the browser refuses, so
 * the button can show that rather than pretending to listen.
 */
export async function startSpeech(id: string, next: Listener): Promise<boolean> {
  if (!speechSupported()) return false

  const r = ensure()
  if (active) await stopSpeech()

  active = id
  listener = next
  try {
    r.start()
    return true
  } catch {
    active = null
    listener = null
    return false
  }
}

export function activeSpeechId(): string | null {
  return active
}
