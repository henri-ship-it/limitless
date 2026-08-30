'use client'

import { useState, type ReactNode } from 'react'
import { Section } from './Section'
import { Checklist } from './Checklist'
import type { ChecklistItem } from '@/content/checklist'

/** Long enough to read as a dissolve, short enough not to be a wait. */
const FADE_MS = 700

/**
 * The setting up list, and what takes its place once it is done.
 *
 * Setting up matters for a day and never again, so the list does not sit there
 * ticked for sixteen weeks. The moment the last item goes in it dissolves and
 * the week in hand comes up in its place, heading and all.
 *
 * The heading lives here rather than on the page because it changes with the
 * content: a section still titled "Get started" above a pointer to week 3 is
 * the sort of thing nobody notices for months.
 */
export function GetStarted({
  items,
  completed,
  children,
}: {
  items: ChecklistItem[]
  completed: string[]
  /** What the page shows once there is nothing left to set up. */
  children: ReactNode
}) {
  const [stage, setStage] = useState<'list' | 'leaving' | 'done'>('list')

  return (
    <Section id="get-started" label={stage === 'done' ? 'Where you are' : 'Get started'}>
      {stage === 'done' ? (
        <div className="animate-[settle_500ms_ease-out]">{children}</div>
      ) : (
        <div
          /*
           * Blurred and lifted rather than simply faded, so it reads as the
           * list being finished with rather than as the page failing to load.
           * The grid rows carry the height down with it, which is what stops
           * everything below jumping when it goes.
           */
          className={`grid transition-all ease-out motion-reduce:transition-none ${
            stage === 'leaving'
              ? 'grid-rows-[0fr] scale-[0.98] opacity-0 blur-md'
              : 'grid-rows-[1fr] scale-100 opacity-100 blur-0'
          }`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
          aria-hidden={stage === 'leaving'}
        >
          <div className="overflow-hidden">
            <Checklist
              items={items}
              completed={completed}
              onAllDone={() => {
                setStage('leaving')
                setTimeout(() => setStage('done'), FADE_MS)
              }}
            />
          </div>
        </div>
      )}
    </Section>
  )
}
