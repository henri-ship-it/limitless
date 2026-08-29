'use client'

import { useEffect, useState } from 'react'

export type TocItem = {
  id: string
  label: string
  /** Shown under the entry while it is pointed at. */
  children?: { id: string; label: string }[]
}

/**
 * Right hand contents, with the current section tracked as the page scrolls.
 *
 * An entry with chapters under it opens them on hover and at no other time:
 * sixteen chapters under four modules is a wall, and the point of a contents
 * list is to be smaller than the thing it indexes. Opening whichever section
 * you happen to be scrolled through would mean the list rearranged itself
 * while you were reading it.
 */
export function OnThisPage({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    )

    for (const h of headings) observer.observe(h)
    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) return null

  return (
    <nav className="hidden xl:block xl:w-56 xl:shrink-0" aria-label="On this page">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-5">
        <p className="label mb-3">On this page</p>
        <ul className="border-l border-line">
          {items.map((item) => {
            // Only what is being pointed at. Opening the section you happen to
            // be scrolled through means the list moves on its own, which is the
            // one thing a contents list should never do.
            const showing = open === item.id
            return (
              <li
                key={item.id}
                onMouseEnter={() => setOpen(item.id)}
                onMouseLeave={() => setOpen(null)}
              >
                <a
                  href={`#${item.id}`}
                  className={`-ml-px block border-l py-1.5 pl-4 text-[0.8125rem] ${
                    active === item.id
                      ? 'border-ink text-ink'
                      : 'border-transparent text-ink-56 hover:text-ink'
                  }`}
                >
                  {item.label}
                </a>

                {item.children?.length ? (
                  /*
                   * Kept in the tree and collapsed rather than removed, so the
                   * height animates and a pointer moving down onto a chapter
                   * does not chase a list that is still arriving.
                   *
                   * Two divs, not a ul wrapping a div: only list items may sit
                   * inside a list, and a div put there is hoisted out of it by
                   * the parser - taking the chapters out of the box that was
                   * meant to be collapsing them, which is exactly what happened.
                   */
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                      showing ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                    aria-hidden={!showing}
                  >
                    <div className="overflow-hidden">
                      <ul>
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <a
                              href={`#${child.id}`}
                              tabIndex={showing ? undefined : -1}
                              className="block py-1 pl-7 text-[0.8125rem] text-ink-40 hover:text-ink"
                            >
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
