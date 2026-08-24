'use client'

import { useEffect, useState } from 'react'

export type TocItem = { id: string; label: string }

/** Right hand contents, with the current section tracked as the page scrolls. */
export function OnThisPage({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id)

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
          {items.map((item) => (
            <li key={item.id}>
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
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
