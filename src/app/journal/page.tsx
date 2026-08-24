import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { weeks } from '@/content/programme'
import { entriesForWeek } from '@/content/journal'
import { isUnlocked } from '@/lib/cohort'

export default function JournalPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Library"
        title="The journal"
        meta={
          <>
            <span className="label">112 entries</span>
            <span className="label">Seven a week</span>
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
          Entries carry the exercises for the week. They are written to be done in order, on the day.
          The huddle closes each week: what went well, what did not, and what you will change.
        </p>
        <p>
          <a href="/journal/download">Download the PDF journal</a>
        </p>
      </Section>

      {weeks.map((week) => {
        const entries = entriesForWeek(week.number)
        const unlocked = isUnlocked(week.number)
        return (
          <Section
            key={week.number}
            label={`Week ${String(week.number).padStart(2, '0')} · ${week.title}`}
          >
            {unlocked ? (
              <ul className="!list-none !pl-0">
                {entries.map((e) => (
                  <li key={e.n} className="flex gap-4 border-t border-line py-3">
                    <span className="label w-12 shrink-0 pt-1">
                      {String(e.n).padStart(3, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem]">{e.title ?? 'Daily entry'}</span>
                      {e.prompts.map((p) => (
                        <span key={p} className="mt-1 block text-[0.8125rem] text-ink-muted">
                          {p}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted">
                Entries {week.firstEntry} to {week.firstEntry + 6}. These open when the week does.
              </p>
            )}
          </Section>
        )
      })}
    </Shell>
  )
}
