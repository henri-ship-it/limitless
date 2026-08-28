import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { SITE } from '@/content/site'

export const metadata = { title: 'Terms · Limitless' }

const TOC = [
  { id: 'what', label: 'What you have bought' },
  { id: 'access', label: 'Your access' },
  { id: 'not-therapy', label: 'What this is not' },
  { id: 'content', label: 'The material' },
  { id: 'conduct', label: 'The community' },
  { id: 'liability', label: 'Liability' },
  { id: 'law', label: 'Governing law' },
]

export default function TermsPage() {
  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow="Legal"
        title="Terms"
        lede="The agreement between you and LMNTARY Performance for the Limitless programme."
        pills={<span className="pill">Updated {SITE.legalUpdated}</span>}
      />

      <Section id="what" label="What you have bought">
        <p>
          A place on Limitless, a sixteen week performance psychology programme run by{' '}
          {SITE.business}. Every member receives the printed journal and its PDF, a weekly digest
          for each of the sixteen weeks, the chapter masterclasses, the onboarding call recording,
          and the recording of each module workshop.
        </p>
        <p>
          Pro members also join the four module workshops live, the weekly group call, and the
          WhatsApp community, and can reach {SITE.founder} directly there.
        </p>
      </Section>

      <Section id="access" label="Your access">
        <p>
          Your place is personal to you. Sign-in links are sent to your email address and should
          not be forwarded. Sharing your access, or the material behind it, ends your membership
          without a refund.
        </p>
        <p>
          The programme is released a week at a time, in step with the digests. A chapter opens at
          4pm on the day before its week begins.
        </p>
        <p>
          We will keep this platform running for the duration of your cohort and for twelve months
          afterwards. If we ever have to close it earlier, we will give you notice and time to
          download your journal.
        </p>
      </Section>

      <Section id="not-therapy" label="What this is not">
        <p>
          Limitless is education and coaching in performance psychology. It is not therapy, not
          medical treatment, and not a substitute for either.
        </p>
        <p>
          Nothing here diagnoses or treats a condition. If you are struggling with your mental
          health, please speak to your GP or a qualified clinician. In a crisis in the UK, call
          Samaritans on 116 123 or 999.
        </p>
        <p>
          You stay responsible for the decisions you make. We cannot promise a particular outcome,
          because what you get out of the programme depends on the work you put into it.
        </p>
      </Section>

      <Section id="content" label="The material">
        <p>
          The journal, digests, videos, workshops and diagrams belong to {SITE.business}. They are
          yours to use for your own development, and not to copy, share, resell or teach from.
        </p>
        <p>
          What you write in your journal is yours. We claim no ownership of it, and we will not
          publish it or quote from it.
        </p>
      </Section>

      <Section id="conduct" label="The community">
        <p>
          Pro members share a WhatsApp group and a weekly call. Both depend on people speaking
          openly, which only works if what is said there stays there.
        </p>
        <p>
          Treat other members with respect, keep what they share private, and do not use the group
          to sell anything. We may remove someone from the community if that is not upheld.
        </p>
      </Section>

      <Section id="liability" label="Liability">
        <p>
          We do not limit our liability for death or personal injury caused by our negligence, for
          fraud, or for anything else the law does not allow us to limit.
        </p>
        <p>
          Beyond that, our liability to you is limited to what you paid for your place. We are not
          liable for indirect losses, such as lost income or lost opportunity.
        </p>
        <p>
          We aim to keep the platform available, but we cannot promise it will never be down. Your
          journal is stored in the database and can be downloaded a week at a time from each huddle
          entry, which we would encourage if a record matters to you.
        </p>
      </Section>

      <Section id="law" label="Governing law">
        <p>
          These terms are governed by the law of England and Wales, and the courts of England and
          Wales have jurisdiction.
        </p>
        <p>
          Questions about any of this go to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </Section>
    </Shell>
  )
}
