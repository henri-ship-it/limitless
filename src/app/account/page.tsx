import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { NudgeToggle } from '@/components/NudgeToggle'
import { WipeEntries } from '@/components/WipeEntries'
import { CopyEmail } from '@/components/CopyEmail'
import { getMember } from '@/lib/member'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { SUPPORT_EMAIL } from '@/content/assets'
import { COHORT } from '@/content/programme'

export const metadata = { title: 'Your account · Limitless' }

const TOC = [
  { id: 'membership', label: 'Membership' },
  { id: 'messages', label: 'Messages' },
  { id: 'entries', label: 'Your entries' },
  { id: 'support', label: 'Support' },
]

export default async function AccountPage() {
  const member = await getMember()
  if (!member) redirect('/sign-in?next=/account')

  let entryCount = 0
  if (supabaseConfigured) {
    const supabase = await createClient()
    const { count } = await supabase
      .from('member_journal')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', member.id)
    entryCount = count ?? 0
  }

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow="Your account"
        title={member.firstName ?? 'Your account'}
        lede={member.email}
        pills={
          <>
            <span className="tier-tag" data-tier={member.isAdmin ? 'admin' : member.tier}>
              {member.isAdmin ? 'admin' : member.tier}
            </span>
            <span className="pill">Cohort {COHORT.label}</span>
          </>
        }
      />

      <Section id="membership" label="Membership">
        <p>
          {member.tier === 'pro'
            ? 'Pro. You join the four module workshops live, the weekly drop-in call and the WhatsApp community, and you can reach Chris directly there.'
            : 'Core. You have the journal, the weekly digests, every chapter masterclass and the recording of each module workshop. The weekly drop-in call, the WhatsApp community and the live workshops are Pro only.'}
        </p>
        {member.tier === 'core' ? (
          <p className="!text-ink-56 text-[0.8125rem]">
            Interested in Pro? Reply to any email from Chris.
          </p>
        ) : null}
      </Section>

      <Section id="messages" label="Messages">
        <p>
          We send reminders and prompts through the programme to help you keep going. With this on,
          what you have written may shape them, so nudges speak to where you actually are.
        </p>
        <NudgeToggle enabled={member.personalisedNudges} />
        <p className="mt-4 !text-ink-56 text-[0.8125rem]">
          Turn it off and you still get the weekly digests. The{' '}
          <Link href="/privacy">privacy notice</Link> sets out exactly what is held and who can see
          it.
        </p>
      </Section>

      <Section id="entries" label="Your entries">
        <p>
          Everything you write is saved so it follows you between devices. You can start again
          whenever you want to: that clears your entries and the weeks you have marked complete,
          and leaves the rest of your account alone.
        </p>
        <WipeEntries count={entryCount} />
        <p className="mt-4 !text-ink-56 text-[0.8125rem]">
          You can also download any week as a file, from that week&rsquo;s huddle entry.
        </p>
      </Section>

      <Section id="support" label="Support">
        <p>
          {member.tier === 'pro'
            ? 'Message the WhatsApp community, or email Chris for anything you would rather keep private.'
            : 'Email Chris, or reply to any email he sends. He reads and answers every one.'}
        </p>
        <CopyEmail address={SUPPORT_EMAIL} />
      </Section>

      <div className="border-t border-line px-6 py-8 sm:px-10">
        <a href="/auth/sign-out" className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink">
          Sign out
        </a>
      </div>
    </Shell>
  )
}
