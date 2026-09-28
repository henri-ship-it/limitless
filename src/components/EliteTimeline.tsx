import Link from 'next/link'
import { eliteChapters, chaptersInModule, ELITE } from '@/content/elite'
import { modules } from '@/content/programme'
import { TickIcon } from './icons'

type State = 'done' | 'now' | 'open' | 'ahead'

/**
 * The year as one run: twelve chapters under the four modules.
 *
 * The weekly version of this has seventeen cells and has to stack on a phone.
 * Twelve fit across even on a narrow screen, so there is one layout rather than
 * two, and the module names sit under their three chapters at both sizes.
 *
 * Nothing ahead is locked shut. A member who wants to read next chapter's pages
 * early is not doing anything wrong on a programme that runs to their own
 * clock, so what is not open yet reads as not yet rather than as forbidden.
 */
export function EliteTimeline({
  currentChapter,
  completedChapters,
}: {
  currentChapter: number
  completedChapters: number[]
}) {
  const done = new Set(completedChapters)
  const percent = Math.round((done.size / ELITE.chapters) * 100)

  const stateOf = (n: number): State =>
    done.has(n) ? 'done' : n === currentChapter ? 'now' : n > currentChapter ? 'ahead' : 'open'

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="label">
          {done.size} of {ELITE.chapters} chapters complete
        </p>
        <p className="label">{percent}%</p>
      </div>

      <div className="mb-8 h-1 w-full bg-ink-8">
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-stretch gap-2 sm:gap-3">
        {modules.map((m) => (
          <div key={m.number} className="flex flex-1 flex-col gap-2">
            <div className="flex gap-[3px]">
              {chaptersInModule(m.number).map((c) => (
                <Marker
                  key={c.n}
                  label={String(c.n)}
                  caption={c.title}
                  state={stateOf(c.n)}
                  href={`/elite/chapter/${c.n}`}
                />
              ))}
            </div>
            <p className="label !text-[0.625rem] truncate">{m.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Marker({
  label,
  caption,
  state,
  href,
}: {
  label: string
  caption: string
  state: State
  href: string
}) {
  const tone =
    state === 'done'
      ? 'border-accent bg-accent-soft text-accent-ink'
      : state === 'now'
        ? 'border-ink bg-ink text-white'
        : state === 'ahead'
          ? 'border-line bg-ink-3 text-ink-20 hover:border-ink-20 hover:text-ink-56'
          : 'border-line bg-surface text-ink-56 hover:border-ink hover:text-ink'

  return (
    <Link href={href} className="group relative flex flex-1 !no-underline" title={caption}>
      <span
        className={`flex h-11 flex-1 items-center justify-center border font-mono text-[0.6875rem] transition-colors sm:h-9 sm:text-[0.625rem] ${tone}`}
      >
        {/*
          A chapter still ahead shows its number, greyed. A padlock would be the
          platform inventing a rule: there is no cohort to stay level with here,
          and reading ahead on your own year is not against anything.
        */}
        {state === 'done' ? <TickIcon /> : label}
      </span>
      {/*
        The number alone says nothing, so hovering names the chapter. Hidden on
        a phone, where there is no hover and the tooltip would only ever appear
        mid-tap on the way to the chapter itself.
      */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.04em] text-ink uppercase shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)] sm:group-hover:block sm:group-focus-visible:block"
      >
        {caption}
      </span>
    </Link>
  )
}
