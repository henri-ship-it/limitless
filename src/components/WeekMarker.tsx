import { LockIcon, TickIcon } from './icons'

/**
 * What a week's state looks like down the side of a list: done, open now, or
 * still shut.
 *
 * All three sit in a box of the same size so their centres line up. Set loose
 * and pushed to the right they were a twelve pixel tick, an eight pixel dot and
 * a sixteen pixel padlock sharing a right edge and nothing else, which read as
 * the tick being out of true with everything under it.
 *
 * The tick is the brand green, the same as the dot below it. It was a darker
 * shade for legibility, which is the right call for small text and the wrong
 * one for a mark sitting directly above the very colour it is meant to match.
 */
export function WeekMarker({
  done,
  now,
  locked,
}: {
  done: boolean
  now: boolean
  locked: boolean
}) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
      {done ? (
        <TickIcon className="text-accent" />
      ) : now ? (
        <span className="radar" aria-hidden />
      ) : locked ? (
        <LockIcon className="text-ink-20" />
      ) : null}
    </span>
  )
}
