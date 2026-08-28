'use client'

import { useEffect } from 'react'

/**
 * Scrolls to the section named in the URL once it actually exists.
 *
 * The journal streams in behind a loading state, so on arriving from a link
 * like /journal#week-3 the browser looks for that section, does not find it
 * yet, and gives up at the top of the page. By the time the weeks render
 * nothing is going to try again. This waits for the target and then jumps.
 */
export function JumpToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return

    /*
     * Existing is not enough. The weeks arrive inside the hidden buffer React
     * streams into, so for a second or two the section can be found by id while
     * having no height and no position - and scrolling to it does nothing at
     * all. Waiting for it to take up space is waiting for it to be real.
     *
     * The journal runs to some fifty thousand pixels, so laying it out takes
     * longer than a page has any right to. Hence the generous deadline.
     */
    const deadline = performance.now() + 12_000
    const find = () => {
      const target = document.getElementById(id)
      if (target && target.getBoundingClientRect().height > 0) {
        target.scrollIntoView()
        return
      }
      if (performance.now() < deadline) requestAnimationFrame(find)
    }
    requestAnimationFrame(find)
  }, [])

  return null
}
