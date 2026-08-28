'use client'

import { useState, type ReactNode } from 'react'

export type Tab = {
  key: string
  label: string
  /** Sits beside the label, for a count worth seeing before you click. */
  note?: string
  panel: ReactNode
}

/**
 * One member's record, four ways, so the page is a choice rather than a scroll.
 *
 * Everything that is an action - how to reach them, drafting a message - stays
 * above this. What sits in here is reading material, and only one of these is
 * ever the reason you opened the page.
 */
export function MemberTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key)
  if (!tabs.length) return null

  const current = tabs.find((tab) => tab.key === active) ?? tabs[0]

  return (
    <div>
      <div
        role="tablist"
        className="mb-6 flex flex-wrap gap-x-5 gap-y-2 border-b border-line"
      >
        {tabs.map((tab) => {
          const on = tab.key === current.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(tab.key)}
              className={`label -mb-px border-b-2 pb-2.5 ${
                on ? '!border-ink !text-ink' : 'border-transparent hover:!text-ink'
              }`}
            >
              {tab.label}
              {tab.note ? (
                <span className={on ? '!text-ink-56' : '!text-ink-40'}> {tab.note}</span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">{current.panel}</div>
    </div>
  )
}
