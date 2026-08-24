import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { LockIcon } from '@/components/icons'
import { modules, weeks } from '@/content/programme'
import { entriesForWeek } from '@/content/journal'
import { JOURNAL_PAGE_HEIGHT, JOURNAL_PAGE_WIDTH, pageForEntry } from '@/content/journal-pages'
import { isUnlocked } from '@/lib/cohort'
import { getMember } from '@/lib/member'

const TOC = modules.map((m) => ({
  id: `module-${m.number}`,
  label: `${String(m.number).padStart(2, '0')} ${m.name}`,
}))

export default async function JournalPage() {
  const member = await getMember()
  const tier = member?.tier ?? 'core'

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow="Library"
        title="The journal"
        lede="Every entry in the printed book, in order. Preview your day, work the entry, then review it."
        pills={
          <>
            <span className="pill">112 entries</span>
            <span className="pill">7 a week</span>
            <span className="pill">16 weeks</span>
          </>
        }
      />

      <Section label="How it works">
        <p>
          Each day has a preview and a review. Preview your day, set three intentions, and track
          your schedule. At the end of the day record one win, one thing on your mind, and one thing
          you are grateful for.
        </p>
        <p>
          The entry itself carries the exercise for that day. The huddle closes each week: what went
          well, what did not, and what you will change.
        </p>
        <p>
          <a href="/journal/download">Download the PDF journal</a>
        </p>
      </Section>

      {modules.map((m) => (
        <div key={m.number} id={`module-${m.number}`} className="scroll-mt-20">
          <div className="border-b border-line bg-ink-3 px-6 py-4 sm:px-10">
            <p className="label">
              Module {String(m.number).padStart(2, '0')} · {m.name}
            </p>
          </div>

          {m.weeks.map((n) => {
            const week = weeks.find((w) => w.number === n)!
            const entries = entriesForWeek(n)
            const unlocked = isUnlocked(n, tier)

            return (
              <section
                key={n}
                id={`week-${n}`}
                className="scroll-mt-20 border-b border-line px-6 py-10 sm:px-10"
              >
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="pill">Week {String(n).padStart(2, '0')}</span>
                  <h2 className="text-[1.25rem] font-medium tracking-[-0.015em]">{week.title}</h2>
                  {!unlocked ? (
                    <span className="pill ml-auto">
                      <LockIcon /> Locked
                    </span>
                  ) : null}
                </div>

                {unlocked ? (
                  <ol className="space-y-8">
                    {entries.map((entry, i) => {
                      const image = pageForEntry(entry.n)
                      const day = i + 1
                      const isHuddle = entry.title === 'Huddle'
                      return (
                        <li
                          key={entry.n}
                          className="grid gap-5 border-t border-line pt-6 sm:grid-cols-[7rem_1fr]"
                        >
                          <div>
                            <p className="label">{isHuddle ? 'Huddle' : `Day ${String(day).padStart(2, '0')}`}</p>
                            <p className="label !text-ink-20 mt-1">
                              Entry {String(entry.n).padStart(3, '0')}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[1rem] font-medium">
                              {entry.title ?? 'Daily entry'}
                            </p>
                            {entry.prompts.length ? (
                              <ul className="mt-2 space-y-1.5">
                                {entry.prompts.map((p) => (
                                  <li key={p} className="text-[0.875rem] leading-relaxed text-ink-72">
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            {image ? (
                              <img
                                src={image}
                                alt={`Journal spread for entry ${entry.n}`}
                                width={JOURNAL_PAGE_WIDTH}
                                height={JOURNAL_PAGE_HEIGHT}
                                loading="lazy"
                                decoding="async"
                                className="mt-4 w-full max-w-2xl border border-line"
                              />
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <p className="text-[0.9375rem] text-ink-56">
                    Entries {week.firstEntry} to {week.firstEntry + 6}. These open when the week
                    does.
                  </p>
                )}
              </section>
            )
          })}
        </div>
      ))}
    </Shell>
  )
}
