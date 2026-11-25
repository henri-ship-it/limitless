/**
 * Sending email from the platform.
 *
 * Nothing here was sending mail before this: the assessment results people
 * used to get came from ScoreApp, and taking the assessments back in house
 * takes that with it. This is the smallest thing that puts it back.
 *
 * Resend over plain fetch rather than a client library, because one POST does
 * not justify a dependency and the whole surface is visible here. Swapping
 * provider means changing `deliver` and nothing else.
 *
 * It is deliberately not fatal when unconfigured. A result is already stored
 * and already on screen by the time this runs, so a missing key should cost
 * somebody an email, not their result. It says so in the return value and the
 * caller logs it, rather than failing silently.
 */

export type Mail = {
  to: string
  subject: string
  html: string
  text: string
}

export type Sent =
  | { ok: true }
  | { ok: false; reason: 'not configured' | string }

/**
 * The sender is already settled, so only the key has to be supplied.
 *
 * Resend has sent the sign-in emails since the platform launched, with
 * lmntaryperformance.com verified and chris@ as the sender. That key lives in
 * Supabase's SMTP settings rather than in the environment here, because until
 * now nothing in the app sent mail itself. Giving the same key to the app as
 * RESEND_API_KEY is all that is outstanding; the domain is already verified
 * and does not need doing again.
 */
const FROM = 'Chris Bodman <chris@lmntaryperformance.com>'

export const emailConfigured = Boolean(process.env.RESEND_API_KEY)

export async function deliver(mail: Mail): Promise<Sent> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.ASSESSMENT_FROM_EMAIL || FROM
  if (!key) return { ok: false, reason: 'not configured' }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      return { ok: false, reason: `${response.status} ${detail.slice(0, 200)}` }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'send failed' }
  }
}
