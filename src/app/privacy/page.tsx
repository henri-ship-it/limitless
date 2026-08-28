import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { SITE } from '@/content/site'

export const metadata = { title: 'Privacy · Limitless' }

const TOC = [
  { id: 'who', label: 'Who we are' },
  { id: 'what', label: 'What we hold' },
  { id: 'journal', label: 'Your journal' },
  { id: 'why', label: 'Why we hold it' },
  { id: 'who-else', label: 'Who else sees it' },
  { id: 'how-long', label: 'How long' },
  { id: 'rights', label: 'Your rights' },
  { id: 'cookies', label: 'Cookies' },
]

export default function PrivacyPage() {
  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow="Legal"
        title="Privacy"
        lede="What this platform holds about you, why, and what you can ask us to do with it."
        pills={<span className="pill">Updated {SITE.legalUpdated}</span>}
      />

      <Section id="who" label="Who we are">
        <p>
          {SITE.business} runs the Limitless programme and this platform. {SITE.founder} is the
          data controller. Anything in this notice, you can ask about at{' '}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </Section>

      <Section id="what" label="What we hold">
        <ul>
          <li>Your name and email address, which come from your enrolment.</li>
          <li>Your membership tier and which cohort you are in.</li>
          <li>Which weeks you have marked complete and which set up items you have ticked.</li>
          <li>Anything you write in the digital journal.</li>
          <li>
            Anonymous page view counts, which record that a page was opened but not who opened it.
          </li>
        </ul>
        <p>
          We do not hold payment details. Those stay with Stripe, who handle the transaction, and
          we never see a card number.
        </p>
      </Section>

      <Section id="journal" label="Your journal">
        <p>
          The journal is the part of this worth being clear about, because it is where you write
          about your values, your patterns and the things you find difficult.
        </p>
        <p>
          It is stored so that it syncs between your phone and your laptop, and so it is still
          there next week. Other members can never see it. Technically {SITE.founder} can, and he
          may look in order to support you on the programme, for example if you raise something on
          a call or by email. He will not read it for any other reason, and it is never shared
          outside {SITE.business}.
        </p>
        <p>
          If you would rather keep something entirely to yourself, the printed journal is yours
          alone. Nothing you write on paper reaches us.
        </p>
      </Section>

      <Section id="why" label="Why we hold it">
        <p>Under the UK GDPR our lawful bases are:</p>
        <ul>
          <li>
            <strong>Performance of a contract.</strong> You bought a place on Limitless, and your
            name, email, tier and progress are what let us deliver it.
          </li>
          <li>
            <strong>Legitimate interests.</strong> Understanding in aggregate how the programme is
            used, so it can be improved, and supporting you when you ask for help.
          </li>
        </ul>
        <p>
          We do not sell your data, and we do not use it to build advertising profiles.
        </p>
      </Section>

      <Section id="who-else" label="Who else sees it">
        <p>These are the services this platform runs on. Each is a processor acting for us.</p>
        <ul>
          <li>
            <strong>Supabase</strong> stores the database and your journal, hosted in the EU.
          </li>
          <li>
            <strong>Vercel</strong> hosts and serves the site, and counts page views without
            identifying you.
          </li>
          <li>
            <strong>Resend</strong> sends your sign-in emails.
          </li>
          <li>
            <strong>Kit</strong> sends the weekly digests, which sit outside this platform.
          </li>
        </ul>
        <p>
          Some of these operate outside the UK. Where they do, transfers are covered by the
          safeguards in their own terms, such as standard contractual clauses.
        </p>
      </Section>

      <Section id="how-long" label="How long we keep it">
        <p>
          Your account and journal stay while you are a member and for twelve months after the
          cohort ends, so you can come back to what you wrote. After that we delete them, unless
          you ask us to sooner. Ask at any point and we will delete them straight away.
        </p>
      </Section>

      <Section id="rights" label="Your rights">
        <p>Under the UK GDPR you can ask us to:</p>
        <ul>
          <li>give you a copy of everything we hold about you</li>
          <li>correct anything that is wrong</li>
          <li>delete your account and your journal</li>
          <li>hand your data over in a portable format</li>
          <li>stop using it for a particular purpose</li>
        </ul>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we will act within one month.
          You can also download any week of your journal yourself, as markdown, from that week&rsquo;s
          huddle entry.
        </p>
        <p>
          If you think we have handled your data badly, you can complain to the Information
          Commissioner&rsquo;s Office at{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noreferrer">
            ico.org.uk
          </a>
          . We would rather you told us first so we can put it right.
        </p>
      </Section>

      <Section id="cookies" label="Cookies">
        <p>
          One cookie, which keeps you signed in for thirty days on that device. It is necessary for
          the platform to work, so there is no banner asking you to accept it.
        </p>
        <p>
          Page views are counted without cookies and without anything that identifies you, so no
          consent is needed for that either.
        </p>
      </Section>
    </Shell>
  )
}
