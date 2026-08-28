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

    const deadline = performance.now() + 3000
    const find = () => {
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView()
        return
      }
      if (performance.now() < deadline) requestAnimationFrame(find)
    }
    requestAnimationFrame(find)
  }, [])

  return null
}
