import Link from 'next/link'
import { TickIcon } from './icons'
import type { WeekClose } from '@/lib/week-close'

/**
 * The week just gone, at the top of this week's digest.
 *
 * The only moment where "did you finish last week" is a fair question. Asked at
 * the foot of the current digest it arrives days too early, which is how the
 * old button came to be ignored: somebody opening the Sunday email is being
 * asked about seven entries that do not exist yet. Opening this page at all
 * means the week before it is over.
 *
 * The ask is the huddle itself rather than a tick beside it. There is nothing
 * to confirm, only a page still blank, so the link goes to the page.
 */
export function LastWeek({
  week,
  title,
  progress,
}: {
  week: number
  title: string
  progress: WeekClose
}) {
  const number = String(week).padStart(2, '0')
  const closing = progress.entries[progress.entries.length - 1]

  if (progress.closed) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-ink-3 px-6 py-4 sm:px-10">
        <span className="!text-accent" aria-hidden>
          <TickIcon />
        </span>
        <p className="label !text-accent">Week {number} closed</p>
        <p className="label !text-ink-56">
          {progress.written} of {progress.entries.length} entries written
        </p>
      </div>
    )
  }

  return (
    <div className="border-b border-line bg-ink-3 px-6 py-5 sm:px-10">
      <p className="label">Last week</p>
      <p className="mt-2 text-[0.9375rem] leading-relaxed">
        Week {number}, {title}. {progress.written} of {progress.entries.length} entries written,
        and the huddle that closes it is still blank.
      </p>
      <p className="mt-3">
        <Link href={`/journal/${closing.n}`} className="label hover:!text-ink">
          Close out week {number} →
        </Link>
      </p>
    </div>
  )
}
