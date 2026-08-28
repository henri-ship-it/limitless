/**
 * One speech recogniser for the whole page.
 *
 * Two things forced this shape.
 *
 * The browser allows a single recognition session at a time, so building one
 * per field meant the first field to start held the microphone and every other
 * button did nothing.
 *
 * And Safari, which is every browser on iOS, only honours `start()` when it is
 * called synchronously inside the tap that asked for it. Anything awaited first
 * loses that permission. So moving between fields never stops and restarts:
 * the session keeps running and the text is simply routed somewhere else.
 */

type Listener = {
  onText: (text: string) => void
  /** Words heard but not yet settled, so they can be shown as they arrive. */
  onInterim?: (text: string) => void
  /** Called when this field stops receiving, with a reason if it failed. */
  onStop: (reason?: string) => void
}

let recognition: any = null
let active: string | null = null
let listener: Listener | null = null

export function speechSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
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

function ensure() {
  if (recognition) return recognition

  const Recognition =
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  const r = new Recognition()
  r.lang = 'en-GB'
  // iOS ends a session on its own after a pause whatever this asks for, so the
  // button reflects what happened rather than what was requested.
  r.continuous = true
  // Shown live while speaking, which is the difference between a
  // recorder that looks alive and one that looks broken.
  r.interimResults = true

  r.onresult = (event: any) => {
    let said = ''
    let pending = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const text = event.results[i][0].transcript
      if (event.results[i].isFinal) said += text
      else pending += text
    }
    said = said.trim()
    if (said) listener?.onText(said)
    listener?.onInterim?.(pending.trim())
  }

  const finish = (reason?: string) => {
    const ending = listener
    listener = null
    active = null
    ending?.onStop(reason)
  }

  r.onend = () => finish()
  r.onerror = (event: any) => finish(event?.error ?? 'unknown')

  recognition = r
  return r
}

/**
 * Points the recogniser at a field, starting it if nothing is running.
 *
 * Deliberately synchronous: on iOS the call has to happen inside the tap that
 * asked for it, so nothing may be awaited first.
 */
export function startSpeech(id: string, next: Listener): boolean {
  if (!speechSupported()) return false

  const r = ensure()

  /*
   * Already listening for another field: hand the session over rather than
   * stopping and starting, which on iOS would need a fresh tap and so would
   * simply do nothing. This is why a second field used to be dead.
   */
  if (active && active !== id) {
    const previous = listener
    active = id
    listener = next
    previous?.onStop()
    return true
  }

  active = id
  listener = next
  try {
    r.start()
  } catch {
    // Already running for this field, which is not a problem.
  }
  return true
}

export function stopSpeech(): void {
  if (!recognition || !active) return
  try {
    recognition.stop()
  } catch {
    // Already stopped.
  }
}

export function activeSpeechId(): string | null {
  return active
}
