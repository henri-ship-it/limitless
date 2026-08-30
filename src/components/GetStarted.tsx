'use client'

import { useState, type ReactNode } from 'react'
import { Section } from './Section'
import { Checklist } from './Checklist'
import { ChevronIcon } from './icons'
import type { ChecklistItem } from '@/content/checklist'

/** Long enough to read as a dissolve, short enough not to be a wait. */
const FADE_MS = 700

/**
 * The setting up list, and what takes its place once it is done.
 *
 * Setting up leads the page for a day and never again. The moment the last item
 * goes in, the list dissolves and the week in hand comes up in its place.
 *
 * It folds away rather than disappearing, though. The list is where the
 * onboarding recording, the journal PDF and the group invite live, and those
 * are wanted in week nine as much as in week one - just not at the top of the
 * page, and not with five ticks shouting about work already done.
 *
 * The heading lives here rather than on the page because it changes with the
 * content: a section still titled "Get started" above a pointer to week 3 is
 * the sort of thing nobody notices for months.
 */
export function GetStarted({
  items,
  completed,
  settingUp,
  children,
}: {
  items: ChecklistItem[]
  completed: string[]
  /** Whether anything is still outstanding when the page loads. */
  settingUp: boolean
  /** What leads the section once there is nothing left to set up. */
  children: ReactNode
}) {
  const [stage, setStage] = useState<'list' | 'leaving' | 'done'>(settingUp ? 'list' : 'done')
  const [open, setOpen] = useState(false)

  if (stage === 'done') {
    return (
      <Section id="get-started" label="Where you are">
        <div className={settingUp ? 'animate-[settle_500ms_ease-out]' : undefined}>{children}</div>

        <div className="mt-8 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="label flex items-center gap-2 hover:!text-ink"
          >
            <ChevronIcon className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
            Setting up
            <span className="!text-ink-40">
              {completed.length} of {items.length} done
            </span>
          </button>

          <div
            className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
              open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
            aria-hidden={!open}
          >
            <div className="overflow-hidden">
              <div className="pt-4">
                <Checklist items={items} completed={completed} />
              </div>
            </div>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section id="get-started" label="Get started">
      <div
        /*
         * Blurred and lifted rather than simply faded, so it reads as the list
         * being finished with rather than as the page failing to load. The grid
         * rows carry the height down with it, which is what stops everything
         * below jumping when it goes.
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
    </Section>
  )
}
