import { weeks } from '@/content/programme'

/**
 * Where they are in the sixteen weeks, at the top of the digest.
 *
 * The same thing Chris already puts at the top of the Kit email, and it is here
 * for the same reason: somebody opening a chapter wants to know where it sits
 * in the whole before they read it. The Start Guide has the full timeline with
 * every week named and linked. This is deliberately not that. It is one line
 * and one bar, because anything with sixteen tap targets in it is an invitation
 * to leave the page you have just opened.
 *
 * It does not repeat which week this is. The header pill above already says
 * that, and a number printed twice within an inch of itself reads as two facts
 * rather than one. What it adds is how much of the sixteen is behind them,
 * which nothing else on the page says.
 */
export function ProgrammeProgress({ completedWeeks }: { completedWeeks: number[] }) {
  const total = weeks.length
  const done = new Set(completedWeeks).size
  const percent = Math.round((done / total) * 100)

  return (
    <div className="border-b border-line px-6 py-4 sm:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="label">Your progress</p>
        <p className="label !text-ink-56">
          {done} of {total} weeks complete
        </p>
      </div>

      <div className="mt-3 h-1 w-full bg-ink-8">
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
