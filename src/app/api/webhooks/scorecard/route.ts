import { NextResponse } from 'next/server'
import { receiveScorecard } from '@/lib/scorecard'

/** The query form, kept working for anything already pointed at it. */
export async function POST(request: Request) {
  const type = new URL(request.url).searchParams.get('type') ?? 'know-thyself'
  return receiveScorecard(request, type)
}

/**
 * Whether this deployment can accept a scorecard, and if not, why.
 *
 * Reports the shape of the configuration and never a value: a boolean, a
 * length, and the names of any environment variables that look like a
 * near miss, which is what a typo in the key actually looks like from here.
 */
export function GET() {
  const secret = process.env.SCORECARD_WEBHOOK_SECRET ?? ''

  return NextResponse.json({
    configured: Boolean(secret),
    secretLength: secret.length,
    trimmedLength: secret.trim().length,
    similarNames: Object.keys(process.env).filter((name) => /SCORE/i.test(name)),
    draftingConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    environment: process.env.VERCEL_ENV ?? 'not on Vercel',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown',
  })
}
