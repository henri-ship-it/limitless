import { TickIcon } from './icons'
import { BulkPhotos } from './BulkPhotos'
import { MarkWeekDone } from './MarkWeekDone'
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
 * Both ways of answering it are here rather than behind a link. The first
 * version of this sent them to the huddle page, which is the one thing a member
 * who has just opened their digest should not be pushed into: they came to read
 * this week, and the way to deal with last week should not cost them the page
 * they are on. So the pages are photographed here, and the tick is here.
 *
 * Most people on 4.0 are writing on paper. For them the week is already done
 * and the platform simply does not know, which is a question of recording
 * rather than of doing. The tick is the honest answer to that, and it is the
 * same control that used to sit at the foot of the digest. It was not a bad
 * button. It was in the wrong place and asked a week too early.
 */
export function LastWeek({
  week,
  title,
  progress,
  ticked,
}: {
  week: number
  title: string
  progress: WeekClose
  /** Already marked complete, by hand or by an earlier reading of the digest. */
  ticked: boolean
}) {
  const number = String(week).padStart(2, '0')
  const total = progress.entries.length

  /*
   * Written beats ticked when both are true. A huddle on the page is a stronger
   * statement than a tick, so it is the one the band reports.
   */
  if (progress.closed || ticked) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-ink-3 px-6 py-4 sm:px-10">
        <span className="!text-accent" aria-hidden>
          <TickIcon />
        </span>
        <p className="label !text-accent">Week {number} complete</p>
        <p className="label !text-ink-56">
          {progress.closed
            ? `${progress.written} of ${total} entries written`
            : progress.written > 0
              ? `${progress.written} of ${total} entries written, and marked done`
              : 'Marked done'}
        </p>
      </div>
    )
  }

  return (
    <div className="border-b border-line bg-ink-3 px-6 py-5 sm:px-10">
      <p className="label">Last week</p>
      <p className="mt-2 text-[0.9375rem] leading-relaxed">
        Week {number}, {title}. {progress.written} of {total} entries written here.
      </p>

      <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-72">
        Wrote it on paper? Photograph last week&rsquo;s spreads and they are read and filed against
        the entries they belong to. Or if you would rather not, tick it off and the week is
        recorded as done.
      </p>

      {/* Side by side, because they are two answers to one question rather
        * than a step and then another step. */}
      <div className="mt-4 flex flex-wrap items-start gap-3">
        <BulkPhotos week={week} label={"Add last week’s pages"} showIntro={false} />
        <MarkWeekDone week={week} done={false} />
      </div>
    </div>
  )
}
