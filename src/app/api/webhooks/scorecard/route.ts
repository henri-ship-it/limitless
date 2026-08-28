import { receiveScorecard } from '@/lib/scorecard'

/** The query form, kept working for anything already pointed at it. */
export async function POST(request: Request) {
  const type = new URL(request.url).searchParams.get('type') ?? 'know-thyself'
  return receiveScorecard(request, type)
}
