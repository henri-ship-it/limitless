import { FlameIcon } from './icons'

/**
 * Days in a row.
 *
 * The one thing on the platform that is not the brand green, because it is not
 * the same kind of thing: everything else reports where you are, and this is
 * the only piece that keeps score.
 *
 * Never wraps and never shrinks. Squeezed into the top bar on a phone it broke
 * after the number and became a two line oval twice the height of everything
 * beside it, which is what took it out of the top bar in the first place.
 *
 * Nothing is rendered at zero. A nought is not a streak, and putting one in
 * front of somebody who joined this morning tells them they are already behind.
 */
export function Streak({ days, className = '' }: { days: number; className?: string }) {
  if (days < 1) return null

  return (
    <span
      className={`label flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 whitespace-nowrap ${className}`}
      style={{
        borderColor: 'var(--color-flame)',
        background: 'var(--color-flame-soft)',
        color: 'var(--color-flame)',
      }}
      title={`${days} ${days === 1 ? 'day' : 'days'} in a row`}
    >
      <FlameIcon />
      {days} day{days === 1 ? '' : 's'} streak
    </span>
  )
}
