/**
 * Whether somebody has actually got to the end of the digest.
 *
 * Kept apart from the component for the same reason the dwell sums are: a week
 * marked complete for somebody who did not read it is invisible in the
 * interface and only shows up as a coach trusting a tick that means nothing.
 * The conditions are worth holding down in a test rather than eyeballing.
 *
 * Three things have to be true together. They must have scrolled at least once,
 * so a digest shorter than the window does not complete the week on load. The
 * end must be on screen. The tab must be in front. Time is continuous, not
 * banked: flicking past the bottom for the link to next week, three times, is
 * still not reading, so the clock restarts from nothing whenever any of the
 * three drops away.
 *
 * The clock is injected so it can be driven by hand.
 */
export type ReachedEnd = {
  /** They scrolled. Until they have, nothing counts. */
  scrolls(): void
  /** The end of the digest came into or went out of view. */
  sees(onScreen: boolean): void
  /** The tab came to the front or went behind something. */
  shows(inFront: boolean): void
  /** True while the clock is running, which is when a check is worth setting. */
  counting(): boolean
  /** True once they have been at the end long enough. Latches. */
  reached(): boolean
}

export function createReachedEnd(
  required = 2500,
  now: () => number = Date.now,
): ReachedEnd {
  let scrolled = false
  let onScreen = false
  let inFront = true
  let since: number | null = null
  let latched = false

  const recompute = () => {
    if (scrolled && onScreen && inFront) {
      if (since === null) since = now()
    } else {
      since = null
    }
  }

  return {
    scrolls() {
      scrolled = true
      recompute()
    },
    sees(next: boolean) {
      onScreen = next
      recompute()
    },
    shows(next: boolean) {
      inFront = next
      recompute()
    },
    counting() {
      return !latched && since !== null
    },
    reached() {
      if (latched) return true
      if (since === null) return false
      if (now() - since < required) return false
      latched = true
      return true
    },
  }
}
