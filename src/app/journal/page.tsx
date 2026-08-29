import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { JumpToHash } from '@/components/JumpToHash'
import { LockIcon } from '@/components/icons'
import { modules, weeks } from '@/content/programme'
import { entriesForWeek } from '@/content/journal'
import { resolveEntry } from '@/lib/entry'
import { JournalVisual } from '@/components/JournalVisual'
import Link from 'next/link'
import { isUnlocked } from '@/lib/cohort'

const TOC = modules.map((m) => ({
  id: `module-${m.number}`,
  label: `${String(m.number).padStart(2, '0')} ${m.name}`,
  children: m.weeks.map((n) => ({
    id: `week-${n}`,
    label: weeks.find((w) => w.number === n)?.title ?? `Week ${n}`,
  })),
}))

export default async function JournalPage() {

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

      <JumpToHash />

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
            const unlocked = isUnlocked(n)

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
                    {entries.map((raw) => {
                      const entry = resolveEntry(raw.n)!
                      return (
                        <li
                          key={entry.n}
                          className="grid gap-5 border-t border-line pt-6 sm:grid-cols-[7rem_1fr]"
                        >
                          <div>
                            <p className="label">{entry.huddle ? 'Huddle' : `Day ${entry.day}`}</p>
                            <p className="label !text-ink-20 mt-1">Entry {entry.n}</p>
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/journal/${entry.n}`}
                              className="text-[1rem] font-medium hover:underline"
                            >
                              {entry.title}
                            </Link>
                            {entry.intro.map((line, i) => (
                              <p key={i} className="mt-2 text-[0.875rem] leading-relaxed text-ink-56">
                                {line}
                              </p>
                            ))}
                            {entry.fields.length ? (
                              <ul className="mt-2 space-y-1.5">
                                {entry.fields.map((field, i) => (
                                  <li key={i} className="text-[0.875rem] leading-relaxed text-ink-72">
                                    {field.kind === 'note' ? field.text : field.label}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            <JournalVisual
                              visual={entry.visual}
                              caption={entry.caption}
                              className="mt-4 max-w-sm border border-line"
                            />
                            <p className="mt-4">
                              <Link href={`/journal/${entry.n}`} className="label hover:!text-ink">
                                Open entry →
                              </Link>
                            </p>
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
