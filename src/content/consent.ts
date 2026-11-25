/**
 * Permission to quote what somebody writes inside the programme, asked once.
 *
 * **Why once, at the start.** Asking at the end of every piece of writing is
 * friction four times a module and it trains people to click past it. Asked
 * once, in plain words, with a real no on the same screen as the yes, it is
 * both less work and better consent than a tick box at the bottom of a
 * reflection somebody has just spent ten minutes on.
 *
 * **What it deliberately does not cover.** Anything that identifies somebody:
 * their surname, their employer, their job title, a photograph, or anything
 * they have written about a diagnosis or about another person. Consent has to
 * be specific and informed, and nobody can informedly agree to the use of a
 * sentence they have not written yet if that sentence might name their
 * employer. So this covers first name or anonymous only, and anything
 * identifiable still gets its own ask at the time. That is roughly one
 * conversation a year rather than one per surface, which is the point.
 *
 * **Why the wording is versioned.** Consent is to a particular set of words.
 * If the words change, what was agreed to is no longer what is being asked,
 * and the old answers cannot simply be carried over. Bump `CONSENT_VERSION`
 * when the copy below changes in substance and everybody is asked again.
 * Spelling fixes are not substance.
 */

export const CONSENT_VERSION = 1

export type ConsentChoice = 'named' | 'anonymous' | 'no'

export type Consent = {
  choice: ConsentChoice
  /** The wording they agreed to, so a later change cannot be backdated. */
  version: number
  at: string
}

export const CONSENT_SLOT = 'consent'

export const CONSENT_TITLE = 'Can we quote you?'

export const CONSENT_BODY = [
  'Over the next few months you will write things in here: your baseline, your journal, the check-ins at the end of each module. Chris reads all of it.',
  'Some of it turns out to be the clearest description anyone has given of what this programme does. When that happens we would like to be able to use it, on the website, in an email, or to show somebody who is deciding whether to join.',
  'Your answer now covers your first name or nothing at all. It never covers your surname, your employer, your job title or your photograph. If we ever want to use something that would identify you, we come back and ask you about that specific thing.',
]

export const CONSENT_CHOICES: {
  value: ConsentChoice
  label: string
  detail: string
}[] = [
  {
    value: 'named',
    label: 'Yes, with my first name',
    detail: 'Quotes appear as, for example, "Adele". Never a surname.',
  },
  {
    value: 'anonymous',
    label: 'Yes, but keep me anonymous',
    detail: 'Quotes appear with no name at all.',
  },
  {
    value: 'no',
    label: 'No',
    detail: 'Nothing you write leaves the programme. Chris still reads it.',
  },
]

/** Said on both screens, because it is the part that makes the yes safe. */
export const CONSENT_FOOTNOTE =
  'You can change this whenever you like, in your account. Changing it to no takes anything of yours out of use from that point.'

export function consentOf(assessment: unknown): Consent | null {
  const held = (assessment as Record<string, unknown> | null)?.[CONSENT_SLOT]
  if (!held || typeof held !== 'object') return null
  const consent = held as Partial<Consent>
  if (consent.choice !== 'named' && consent.choice !== 'anonymous' && consent.choice !== 'no') {
    return null
  }
  return { choice: consent.choice, version: Number(consent.version) || 0, at: String(consent.at) }
}

/** Whether to put the question in front of somebody. */
export function needsConsent(assessment: unknown): boolean {
  const consent = consentOf(assessment)
  return !consent || consent.version < CONSENT_VERSION
}

/** What a member may be quoted as, for anything that wants to use their words. */
export function quotableAs(assessment: unknown): 'first-name' | 'anonymous' | null {
  const consent = consentOf(assessment)
  if (!consent || consent.version < CONSENT_VERSION) return null
  if (consent.choice === 'named') return 'first-name'
  if (consent.choice === 'anonymous') return 'anonymous'
  return null
}
