'use client'

import { useEffect, useRef } from 'react'
import { toggleWeek } from '@/app/actions'
import { createReachedEnd } from '@/lib/reached-end'

/**
 * Marks the week complete once the member reaches the end of the digest.
 *
 * The button at the foot of the page stays, and stays the way to undo this.
 * What it does not do is get pressed: somebody reads the digest, closes the
 * tab, and the week reads as untouched, which makes the ticks in the sidebar a
 * record of who remembers to tick rather than of who is doing the work.
 *
 * What counts as having got there lives in reached-end, where it is tested.
 */
export function DigestEnd({ week, done }: { week: number; done: boolean }) {
  const sentinel = useRef<HTMLDivElement>(null)
  // Set for a week already complete, so this never writes over a member who
  // has deliberately unticked it.
  const fired = useRef(done)

  useEffect(() => {
    if (fired.current) return
    const target = sentinel.current
    if (!target) return

    const end = createReachedEnd()
    let timer: ReturnType<typeof setTimeout> | null = null

    /*
     * The gate says whether the clock is running; this sets a single check for
     * the moment it would come good. Cleared and reset rather than left to run,
     * since the clock restarts whenever they leave the end of the page.
     */
    const check = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (fired.current || !end.counting()) return
      timer = setTimeout(() => {
        timer = null
        if (fired.current || !end.reached()) return
        fired.current = true
        toggleWeek(week, true).catch(() => {})
      }, 2500)
    }

    const observer = new IntersectionObserver(([entry]) => {
      end.sees(entry.isIntersecting)
      check()
    })
    observer.observe(target)

    /*
     * Scrolling is listened for as well as observed. The observer only speaks
     * when the intersection changes, so for a digest whose end is already on
     * screen it says its piece before the first scroll and then never again.
     */
    const onScroll = () => {
      end.scrolls()
      check()
    }

    const onVisibility = () => {
      end.shows(document.visibilityState === 'visible')
      check()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [week])

  return <div ref={sentinel} aria-hidden />
}
