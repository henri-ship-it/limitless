import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { COHORT } from '@/content/programme'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { assets } from '@/content/assets'
import { getMember } from '@/lib/member'

export default async function ProPage() {
  const member = await getMember()
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

      <Section label="Weekly drop-in call">
        <p>
          {COHORT.dropIn.day}s, {COHORT.dropIn.time}. Half an hour, every week of the programme.
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
