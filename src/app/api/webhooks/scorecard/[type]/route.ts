import { receiveScorecard } from '@/lib/scorecard'

/**
 * The address to give ScoreApp:
 *
 *   .../api/webhooks/scorecard/know-thyself
 *   .../api/webhooks/scorecard/pre-assessment   (both Core and Pro point here)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params
  return receiveScorecard(request, type)
}
