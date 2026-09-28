import Link from 'next/link'
import { modules } from '@/content/programme'
import { chaptersInModule, ELITE } from '@/content/elite'
import { eliteEntriesForChapter } from '@/content/elite-journal'

/**
 * The Elite journal, laid out as the four modules hold it.
 *
 * Twelve chapters of twenty eight, grouped three to a module, and each chapter
 * broken into its four weeks. Three hundred and thirty six entries in one run
 * would be unreadable, and the four weeks are how the chapter is actually
 * worked.
 *
 * No deload rows and no padlocks, because Elite has neither. A deload exists on
 * the sixteen week programme to break up a new framework every week, and the
 * locks exist to keep a cohort level. Neither applies to somebody on their own
 * clock, and printing them would describe a programme this member is not on.
 */

export const ELITE_TOC = modules.map((m) => ({
  id: `module-${m.number}`,
  label: `${String(m.number).padStart(2, '0')} ${m.name}`,
  children: chaptersInModule(m.number).map((c) => ({
    id: `chapter-${c.n}`,
    label: c.title,
  })),
}))

export function EliteJournalIndex({ currentChapter }: { currentChapter: number }) {
  return (
    <>
      {modules.map((m) => (
        <div key={m.number} id={`module-${m.number}`} className="scroll-mt-20">
          <div className="border-b border-line bg-ink-3 px-6 py-4 sm:px-10">
            <p className="label">
              Module {String(m.number).padStart(2, '0')} · {m.name}
            </p>
          </div>

          {chaptersInModule(m.number).map((c) => {
            const entries = eliteEntriesForChapter(c.n)
            const weeks = [0, 1, 2, 3].map((i) => ({
              n: i + 1,
              entries: entries.slice(i * 7, i * 7 + 7),
            }))

            return (
              <section
                key={c.n}
                id={`chapter-${c.n}`}
                className="scroll-mt-20 border-b border-line px-6 py-10 sm:px-10"
              >
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="pill">Chapter {String(c.n).padStart(2, '0')}</span>
                  <h2 className="text-[1.25rem] font-medium tracking-[-0.015em]">
                    <Link href={`/elite/chapter/${c.n}`} className="!text-ink hover:underline">
                      {c.title}
                    </Link>
                  </h2>
                  {c.n === currentChapter ? (
                    <span className="ml-1 flex items-center gap-2">
                      <span className="radar" aria-hidden />
                      <span className="label !text-accent">Now</span>
                    </span>
                  ) : null}
                  <span className="label !text-ink-40 ml-auto">Journal {c.volume}</span>
                </div>

                <div className="space-y-7">
                  {weeks.map((week) => (
                    <div key={week.n}>
                      <p className="label !text-ink-40 mb-2">
                        Week {week.n} of {ELITE.weeksPerChapter}
                      </p>
                      <ul className="!list-none !pl-0">
                        {week.entries.map((entry, i) => (
                          <li key={entry.n} className="border-t border-line">
                            <Link
                              href={`/journal/${entry.n}`}
                              className="flex items-baseline gap-4 py-2.5 !no-underline hover:bg-ink-3"
                            >
                              <span className="label w-20 shrink-0">
                                {/* Seven to a week, so the last of them closes it. */}
                                {i === 6 ? 'Huddle' : `Day ${i + 1}`}
                              </span>
                              <span className="label !text-ink-20 w-16 shrink-0">{entry.n}</span>
                              <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">
                                {entry.title ?? entry.prompts[0] ?? entry.intro[0] ?? 'Reflection'}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ))}
    </>
  )
}

