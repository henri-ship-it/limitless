import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { COHORT } from '@/content/programme'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { MessageChris } from '@/components/MessageChris'
import { CopyEmail } from '@/components/CopyEmail'
import { assets, SUPPORT_EMAIL } from '@/content/assets'
import { ELITE, ELITE_ENTRIES, ELITE_WEEKS } from '@/content/elite'
import { getMember } from '@/lib/member'
import { getMode } from '@/lib/programme-mode'

export default async function ProPage() {
  const member = await getMember()

  /*
   * Branching on the programme being shown rather than on the tier, which is
   * what this got wrong. The two admins are tier pro, so toggling into Elite
   * left them reading the Pro page: a WhatsApp community, a Wednesday drop-in
   * and four workshops, none of which exists on Elite. An Elite member saw the
   * right page and the people checking it never did.
   */
  const mode = await getMode(member?.tier ?? 'core', member?.isAdmin ?? false)
  if (mode === 'elite') return <ElitePage />

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
        lede="What Limitless Elite is, and how the support around it works."
        pills={
          <>
            <span className="pill">elite</span>
            <span className="pill">{ELITE.chapters} chapters</span>
            <span className="pill">{ELITE_WEEKS} weeks</span>
            <span className="pill">{ELITE_ENTRIES} entries</span>
          </>
        }
      />

      <Section label="The programme">
        <p>
          Twelve chapters across a year, three in each of four modules. A chapter is one framework
          and four weeks to work it through, with twenty eight journal entries to write against.
        </p>
        <p className="!mb-0">
          It runs to your own clock. Each chapter opens four weeks after the last, counted from the
          day you started, so the programme follows where you actually are.
        </p>
      </Section>

      <Section label="Check-ins">
        <p>
          Two with Chris in every chapter, so twice a month and {ELITE.chapters * ELITE.checkInsPerChapter}{' '}
          across the year. Half an hour each on what the chapter is surfacing, what you are carrying
          into the next one, and anything in the way.
        </p>
        <p className="!mb-0">They are yours to move, and they follow your chapters rather than a fixed slot.</p>
      </Section>

      <Section label="WhatsApp support">
        <p>Message Chris directly, any time across the year. Any questions, please reach out.</p>
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
