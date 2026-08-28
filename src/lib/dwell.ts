/**
 * The accounting behind time on page, kept apart from the component.
 *
 * Worth its own file because the sums are where this went wrong: the first
 * version stopped its clock on every flush and never restarted it, so each page
 * reported a single twenty second stretch and then nothing, for as long as
 * somebody sat reading. That is invisible in the interface and only shows up as
 * a suspiciously round number weeks later, which is exactly the sort of thing a
 * test should hold.
 *
 * The clock is injected so it can be driven by hand.
 */
export type Dwell = {
  /** They are here and reading. Idempotent. */
  resume(): void
  /** They are not. Time stops until the next resume. */
  pause(): void
  /**
   * Seconds to record now, and zero when there is nothing worth sending.
   *
   * Anything under the minimum is held back rather than thrown away, so a
   * series of short visits still adds up to the truth.
   */
  flush(stillHere: boolean): number
}

export function createDwell(minimum = 3, now: () => number = Date.now): Dwell {
  let banked = 0
  let since: number | null = null

  const close = (stillHere: boolean) => {
    if (since !== null) {
      banked += Math.round((now() - since) / 1000)
    }
    since = stillHere ? now() : null
  }

  return {
    resume() {
      if (since === null) since = now()
    },
    pause() {
      close(false)
    },
    flush(stillHere: boolean) {
      close(stillHere)
      if (banked < minimum) return 0
      const amount = banked
      banked = 0
      return amount
    },
  }
}
