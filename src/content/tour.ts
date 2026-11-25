/**
 * The walk round the platform.
 *
 * Shown once, after somebody has set their baseline and before they are let
 * loose. Each stop names a real element by its `data-tour` attribute rather
 * than describing where something is, so the ring lands on the actual control
 * and somebody is taught the platform rather than taught a diagram of it.
 *
 * Kept short on purpose. The evidence on product tours is consistent and
 * unflattering: completion falls off a cliff after about five or six steps,
 * and what people remember is the first thing and the last thing. So this is
 * the handful of places somebody genuinely cannot find on their own, and the
 * rest is left to be discovered.
 *
 * A stop whose element is not on the page is skipped rather than pointed at
 * nothing, which is what lets the same list run on the sixteen week home page
 * and the Elite one without being written twice.
 */

export type Stop = {
  /** Matches a `data-tour` attribute somewhere in the layout. */
  target: string
  title: string
  body: string
}

export const TOUR: Stop[] = [
  {
    target: 'week',
    title: 'This week',
    body: 'The chapter you are on. It opens on a Monday and stays open, so a week you fall behind on is still there when you come back to it.',
  },
  {
    target: 'journal',
    title: 'Your journal',
    body: 'Every entry you write, in one place. You can write here or in the printed book. Most people do both and neither is wrong.',
  },
  {
    target: 'modules',
    title: 'The four modules',
    body: 'Three chapters then a lighter week, four times over. The lighter week is not a gap, it is where the last three settle.',
  },
  {
    target: 'blueprint',
    title: 'Your blueprint',
    body: 'Written for you after your welcome call: where you are starting from, where you tend to get stuck, and what to do about it.',
  },
  {
    target: 'account',
    title: 'Everything else',
    body: 'Your details, what you are sent, and this walkthrough again whenever you want it.',
  },
]
