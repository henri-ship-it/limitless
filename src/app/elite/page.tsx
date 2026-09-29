import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Streak } from '@/components/Streak'
import { Section } from '@/components/Section'
import { GetStarted } from '@/components/GetStarted'
import { EliteTimeline } from '@/components/EliteTimeline'
import { CopyEmail } from '@/components/CopyEmail'
import { MessageChris } from '@/components/MessageChris'
import { checklistFor } from '@/content/checklist'
import { modules } from '@/content/programme'
import { SUPPORT_EMAIL } from '@/content/assets'
import {
  ELITE,
  ELITE_ENTRIES,
  ELITE_WEEKS,
  chaptersInModule,
  currentEliteChapter,
  eliteChapter,
  eliteChapters,
  formatEliteChapter,
  weekInChapter,
} from '@/content/elite'
import { getMember, getProgress, getStreak } from '@/lib/member'

export const metadata = { title: 'Elite · Limitless' }

const TOC = [
  { id: 'progress', label: 'Your progress' },
  { id: 'get-started', label: 'Where you are' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'rhythm', label: 'The rhythm' },
  { id: 'support', label: 'Support' },
]

/**
 * The Elite front door, which is the Start Guide written for a year.
 *
 * Deliberately the same page as the sixteen week one rather than a different
 * idea: same progress run, same setting up list, same rhythm table, same place
 * to get help. What changes is the clock. A chapter is four weeks instead of
 * one, there are no deloads and no workshops, and every date is counted from
 * this member's own start rather than a cohort's.
 *
 * Reachable by the Elite member whose programme it is, and by the two people
 * who run it.
 */
export default async function ElitePage() {
  const member = await getMember()
  if (!member || (!member.isAdmin && member.tier !== 'elite')) notFound()

  const progress = await getProgress(member.id)
  const streak = await getStreak()
  const items = checklistFor('elite')
  const settingUp = items.some((item) => !progress.completedItems.has(item.key))

  /*
   * An admin looking at Elite has no start date of their own, so they are shown
   * the programme from its first day rather than as not yet begun. A real Elite
   * member without one is a data problem rather than a state to design for, and
   * the same fallback keeps the page readable while it is fixed.
   */
  const start = member.eliteStartDate ?? new Date().toISOString().slice(0, 10)
  const chapter = currentEliteChapter(start)
  const open = Math.min(ELITE.chapters, Math.max(1, chapter))
  const current = eliteChapter(open)!
  const week = weekInChapter(start)
  // Chapters, not weeks: the year is counted in the twelve things it contains.
  const doneChapters = [...progress.completedWeeks]

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow={`${ELITE.label}, also sold as ${ELITE.alias}`}
        title={member.firstName ? `Welcome, ${member.firstName}` : 'Elite'}
        lede="Twelve chapters over a year, four modules, four journals. This page covers how the programme runs and where you are in it."
        pills={
          <>
            <Streak days={streak} />
            <span className="pill">elite</span>
            {settingUp ? (
              <span className="pill">
                {progress.completedItems.size}/{items.length} set up
              </span>
            ) : null}
            <span className="pill">
              {doneChapters.length}/{ELITE.chapters} chapters complete
            </span>
          </>
        }
      />

      <Section id="progress" label="Your progress">
        <EliteTimeline currentChapter={chapter} completedChapters={doneChapters} />
      </Section>

      <GetStarted items={items} completed={[...progress.completedItems]} settingUp={settingUp}>
        <WhereYouAre start={start} chapter={open} week={week} />
      </GetStarted>

      <Section id="how-it-works" label="How it works">
        <p>
          Four modules, three chapters in each, four weeks to a chapter. A chapter is one framework
          and twenty eight journal entries to work it through, so you have a month with each idea
          rather than a week.
        </p>
        <p>
          Every chapter builds on the one before it. The four modules take you from understanding
          how you operate, through managing your own thinking, to the environment around you and
          what you do with all of it.
        </p>
        <div className="mt-8 space-y-8">
          {modules.map((m) => (
            <div key={m.number} className="border-t border-line pt-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="pill">Module {String(m.number).padStart(2, '0')}</span>
                <span className="text-[1.0625rem] font-medium text-ink">{m.name}</span>
              </div>
              <p className="mb-4 text-[0.9375rem]">{m.summary}</p>
              <ul className="!list-none !pl-0 !mb-0">
                {chaptersInModule(m.number).map((c) => (
                  <li key={c.n} className="border-t border-line">
                    <Link
                      href={`/elite/chapter/${c.n}`}
                      className="flex items-baseline gap-4 py-2.5 !no-underline hover:bg-ink-3"
                    >
                      <span className="label w-20 shrink-0">Chapter {c.n}</span>
                      <span
                        className={`text-[0.9375rem] ${c.n === open ? 'font-medium text-ink' : c.n < open ? 'text-ink' : 'text-ink-56'}`}
                      >
                        {c.title}
                      </span>
                      <span className="label !text-ink-40 ml-auto shrink-0">
                        {formatEliteChapter(start, c.n)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="rhythm" label="The rhythm">
        <p>
          Your year runs to your own clock. Every chapter opens four weeks after the last one, on
          the same weekday you began.
        </p>
        <ul className="!list-none !pl-0 !mb-0">
          <li className="flex gap-5 border-t border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">Daily</span>
            <span>A journal entry. Preview the day, then review it.</span>
          </li>
          <li className="flex gap-5 border-t border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">End of week</span>
            <span>The huddle. What worked, what did not, what changes.</span>
          </li>
          <li className="flex gap-5 border-t border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">Twice a chapter</span>
            <span>A check-in with Chris.</span>
          </li>
          <li className="flex gap-5 border-t border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">Every four weeks</span>
            <span>The next chapter opens here, with its digest.</span>
          </li>
          <li className="flex gap-5 border-y border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">Across the year</span>
            <span>
              {ELITE.chapters} chapters, {ELITE_WEEKS} weeks, {ELITE_ENTRIES} entries.
            </span>
          </li>
        </ul>
      </Section>

      <Section id="support" label="Support">
        <p>Any questions, please reach out.</p>
        <MessageChris />
        <p className="mt-8 text-[0.9375rem]">Or by email, if it is easier.</p>
        <CopyEmail address={SUPPORT_EMAIL} />
      </Section>

      <div className="px-6 py-10 sm:px-10">
        <Link
          href={`/elite/chapter/${open}`}
          className="label !text-white inline-flex items-center bg-ink px-5 py-3 no-underline hover:bg-ink-72"
        >
          Open chapter {open}
        </Link>
      </div>
    </Shell>
  )
}

/** The chapter in hand, and the way into it. */
function WhereYouAre({ start, chapter, week }: { start: string; chapter: number; week: number }) {
  const current = eliteChapters.find((c) => c.n === chapter)!
  const module = modules.find((m) => m.number === current.module)!
  /*
   * Which entry they are meant to be on. Seven a week from the chapter's first,
   * so the fourth day of the second week of a chapter is its eleventh entry.
   */
  const entry = current.firstEntry + Math.max(0, week - 1) * 7

  return (
    <div className="border border-line p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="radar" aria-hidden />
        <span className="label">
          Chapter {String(chapter).padStart(2, '0')} · Module{' '}
          {String(module.number).padStart(2, '0')} {module.name}
        </span>
      </div>
      <p className="!mb-1 text-[1.25rem] font-medium tracking-[-0.015em] text-ink">
        {current.title}
      </p>
      <span className="pill">
        Week {Math.max(1, week)} of {ELITE.weeksPerChapter}
      </span>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/journal/${entry}`}
          className="label !text-white !no-underline bg-ink px-4 py-3 hover:bg-ink-72"
        >
          Open today&rsquo;s entry
        </Link>
        <Link
          href={`/elite/chapter/${chapter}`}
          className="label !no-underline border border-line px-4 py-3 hover:border-ink hover:!text-ink"
        >
          Read the chapter
        </Link>
      </div>
      <p className="mt-3 !mb-0 !text-ink-56 text-[0.8125rem]">
        Entry {entry} of {ELITE_ENTRIES} · Journal {current.volume} · opened{' '}
        {formatEliteChapter(start, chapter)}
      </p>
    </div>
  )
}
