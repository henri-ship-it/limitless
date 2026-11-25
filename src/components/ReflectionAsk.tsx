import { Section } from '@/components/Section'
import { COHORT } from '@/content/programme'

/**
 * The closing reflection, asked for at the top of the final week.
 *
 * It used to be a bare link in a section at the foot of week sixteen, below
 * the digest, the entries and the closing quote, with nothing prompting it.
 * Finishing the programme is the one thing on the platform worth interrupting
 * somebody for, so it leads the week instead.
 *
 * Says nothing about comparing against a starting point. Cohort 4.0 has no
 * baseline on record, because the pre-assessments that ran in ScoreApp were
 * never scored, and the reflection shows where they are rather than inventing
 * a climb. Promising a before and after here would be a promise the page
 * cannot keep for the cohort that reaches it first.
 */
export function ReflectionAsk({ held }: { held: boolean }) {
  return (
    <Section id="reflection" label="Before you start this week">
      <p>
        You have reached the last week. Before you look back over the module, give an honest read
        of where you have landed.
      </p>
      <p>
        Six statements, then a few questions in your own words. About four minutes.
        {held ? ' The rest of this week opens once it is done.' : ''}
      </p>
      <p>
        <a
          href={COHORT.postAssessmentUrl}
          className="label !text-white inline-flex items-center gap-2 bg-ink px-4 py-3 !no-underline hover:bg-ink-72"
        >
          Start your reflection
        </a>
      </p>
    </Section>
  )
}
