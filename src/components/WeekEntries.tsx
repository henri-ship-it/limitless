import Link from 'next/link'
import { TickIcon } from './icons'
import type { WeekClose } from '@/lib/week-close'

/**
 * The week's seven entries, at the foot of the digest.
 *
 * What used to sit here was a button marking the week complete, on a page that
 * opens on the Sunday before the week has started. Being asked to sign off work
 * nobody has done yet is a strange thing to read, and a tick is in any case the
 * wrong answer to "I have finished the digest, now what". The entries are the
 * answer, so they are what is here.
 *
 * `today` is passed only for the week in hand. On a week being read ahead or
 * caught up on there is no day to be on, and marking one would send somebody to
 * the wrong page.
 */
export function WeekEntries({ progress, today }: { progress: WeekClose; today?: number }) {
  return (
    <div className="border-t border-line pt-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <p className="label">This week&rsquo;s entries</p>
        <p className="label !text-ink-56">
          {progress.written} of {progress.entries.length} written
        </p>
      </div>

      <ol className="divide-y divide-line border-y border-line">
        {progress.entries.map((entry) => (
          <li key={entry.n}>
            <Link
              href={`/journal/${entry.n}`}
              className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-ink-3"
            >
              <span
                aria-hidden
                className={`flex size-5 shrink-0 items-center justify-center border ${
                  entry.written ? 'border-accent bg-accent-soft !text-accent' : 'border-line'
                }`}
              >
                {entry.written ? <TickIcon /> : null}
              </span>

              <span className="label w-14 shrink-0 !text-ink-56">
                {entry.huddle ? 'Huddle' : `Day ${entry.day}`}
              </span>

              <span className="min-w-0 flex-1 truncate text-[0.9375rem] group-hover:underline">
                {entry.title}
              </span>

              {entry.n === today ? (
                <span className="label shrink-0 !text-accent">Today</span>
              ) : entry.huddle ? (
                <span className="label hidden shrink-0 !text-ink-20 sm:block">Closes the week</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>

      <p className="label !text-ink-56 mt-5">
        {progress.closed
          ? 'This week is closed.'
          : 'Writing the huddle closes the week. Nothing to tick.'}
      </p>
    </div>
  )
}
