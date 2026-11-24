import { resultEmail } from '@/lib/assessment-email'
import { profileFrom } from '@/lib/style-profile'

/**
 * Renders the result email in the browser, for looking at while editing it.
 *
 * Email is the one thing that cannot be checked by reading the code, and
 * sending a copy to yourself every time you move a margin is a slow way to
 * work. Development only: in production it is not there at all.
 *
 * /api/assessment/preview?dynamo=78&analyst=54&caretaker=41&energiser=66
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 })
  }

  const params = new URL(request.url).searchParams
  const read = (name: string, fallback: number) => {
    // Number(null) is 0, not NaN, so an absent parameter has to be caught
    // before the value is read or every score silently comes out as nought.
    if (!params.has(name)) return fallback
    const value = Number(params.get(name))
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : fallback
  }

  const profile = profileFrom({
    Dynamo: read('dynamo', 78),
    Analyst: read('analyst', 54),
    Caretaker: read('caretaker', 41),
    Energiser: read('energiser', 66),
  })

  if (!profile) return new Response('No profile', { status: 500 })

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? null
  const mail = resultEmail({
    to: 'preview@example.com',
    firstName: params.get('name') || 'Henri',
    profile,
    resultUrl: site ? `${site.replace(/\/$/, '')}/assessment/know-thyself` : null,
    site,
  })

  if (params.get('format') === 'text') {
    return new Response(mail.text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  return new Response(mail.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
