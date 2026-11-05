'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * The way out of a member's profile, following you down the page.
 *
 * A profile is long. The journal alone can run to a hundred entries, and the
 * only link back to the list sat at the very bottom, under all of it, with
 * another at the top. So reading somebody's writing and then going back to the
 * list meant scrolling past everything you had just read, in one direction or
 * the other.
 *
 * It appears once the page header has gone by rather than sitting there from
 * the start, since at the top the ordinary link is already on screen and a
 * second one is just clutter.
 */
export function BackToMembers({ name }: { name: string }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 280)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`sticky top-14 z-30 -mb-px border-y border-line bg-surface/95 backdrop-blur transition-opacity ${
        shown ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!shown}
    >
      <div className="flex items-center gap-4 px-6 py-2.5 sm:px-10">
        <Link href="/admin" className="label shrink-0 hover:!text-ink">
          ← All members
        </Link>
        <span className="label !text-ink-40 truncate">{name}</span>
      </div>
    </div>
  )
}
