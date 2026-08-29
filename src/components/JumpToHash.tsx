'use client'

import { useEffect } from 'react'

/**
 * Scrolls to the section named in the URL once it actually exists.
 *
 * The journal streams in behind a loading state, so on arriving from a link
 * like /journal#week-3 the browser looks for that section, does not find it
 * yet, and gives up at the top of the page. By the time the weeks render
 * nothing is going to try again. This waits for the target and then jumps.
 *
 * Two things it has to survive:
 *
 * Existing is not enough. The weeks arrive inside the buffer React streams
 * into, so for a second or two the section can be found by id while having no
 * height and no position, and scrolling to it does nothing at all. Waiting for
 * it to take up space is waiting for it to be real.
 *
 * And the page may not be on screen. A link opened in a background tab gets no
 * animation frames at all, which is why this polls on a timer instead: throttled
 * in the background, but it does still run. Nothing is scrolled while hidden
 * either, since the browser will restore its own position when the tab is
 * shown, and the two would fight.
 */
export function JumpToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return

    // The journal lays out to some fifty thousand pixels and takes its time.
    const deadline = Date.now() + 20_000
    let timer: ReturnType<typeof setInterval>

    const done = () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', look)
    }

    function look() {
      if (Date.now() > deadline) return done()
      if (document.visibilityState !== 'visible') return

      const target = document.getElementById(id)
      if (!target || target.getBoundingClientRect().height === 0) return

      target.scrollIntoView()
      done()
    }

    timer = setInterval(look, 120)
    document.addEventListener('visibilitychange', look)
    look()

    return done
  }, [])

  return null
}
