import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { COHORT } from '@/content/programme'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { MessageChris } from '@/components/MessageChris'
import { CopyEmail } from '@/components/CopyEmail'
import { assets, SUPPORT_EMAIL } from '@/content/assets'
import { ELITE, ELITE_WEEKS } from '@/content/elite'
import { getMember } from '@/lib/member'

export default async function ProPage() {
  const member = await getMember()

  /*
   * Elite reads the same route and almost none of the same page. There is no
   * community, no drop-in and no workshops, so the Pro copy would describe
   * three things they do not have and one thing they do.
   */
  if (member?.tier === 'elite') return <ElitePage />

  // Core members get a 404 rather than a locked page. Nothing about the Pro
  // community is rendered for them, including in the HTML payload.
  if (member?.tier !== 'pro') notFound()

  return (
    <Shell>
      <PageHeader
        eyebrow="Pro"
        title="Your community"
        lede="What Pro adds on top of the journal, the digests and the masterclasses."
        pills={<span className="pill">Pro</span>}
      />

      <Section label="WhatsApp community">
        {assets.whatsappInvite.url ? (
          <p>
            <a href={assets.whatsappInvite.url} target="_blank" rel="noreferrer">
              Join the WhatsApp community
            </a>
          </p>
        ) : (
          <p className="text-ink-56">
            The invite link is added here before week 1 begins.
          </p>
        )}
      </Section>

      <Section label="Drop-in call">
        <p>
          {COHORT.dropIn.day}s, {COHORT.dropIn.time}. Half an hour, {COHORT.dropIn.when}. The
          deload week that closes each module has the workshop instead.
        </p>
      </Section>

      <Section label="Module workshops">
        <p>
          You join all four workshops live, in the deload week at the end of each module. The
          recording is posted on the deload week page afterwards.
        </p>
      </Section>

      <Section label="1:1 support">
        <p>
          Message Chris directly on WhatsApp at any point during the sixteen weeks.
        </p>
      </Section>
    </Shell>
  )
}

/** What Elite is, for the member on it. */
function ElitePage() {
  return (
    <Shell>
      <PageHeader
        eyebrow={ELITE.label}
        title="Your year"
        lede="What Elite is, and how the support around it works."
        pills={
          <>
            <span className="pill">elite</span>
            <span className="pill">{ELITE.chapters} chapters</span>
            <span className="pill">{ELITE_WEEKS} weeks</span>
          </>
        }
      />

      <Section label="Check-ins">
        <p>
          One with Chris in every chapter, so twelve across the year. Half an hour on what the
          chapter surfaced, what you are carrying into the next one, and anything in the way.
        </p>
        <p className="!mb-0">
          They are yours to move. The programme runs to your clock rather than a cohort&rsquo;s, so
          a check-in follows where you actually are.
        </p>
      </Section>

      <Section label="Direct support">
        <p>
          Elite has no group and no community to post in. Chris is the support line, directly, for
          the whole year. Anything at all, whenever it comes up.
        </p>
        <MessageChris />
        <p className="mt-8 text-[0.9375rem]">Or by email, if it is easier.</p>
        <CopyEmail address={SUPPORT_EMAIL} />
      </Section>

      <Section label="Your journals">
        <p className="!mb-0">
          Four printed books, three chapters in each, {ELITE.entriesPerChapter} entries to a
          chapter. Every page is on the platform too, so you can work on paper or on screen and
          photograph what you have written into the huddle at the end of each week.
        </p>
      </Section>

      <Section label="Your blueprint">
        <p className="!mb-0">
          Written out of your welcome call and your assessment, and revisited as the year goes on.
          It is the one document that holds what you are working on and why.
        </p>
      </Section>
    </Shell>
  )
}
