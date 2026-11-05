import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

/**
 * Whether the Pocket key works, asked without changing anything.
 *
 * The daily job is the only other thing that calls Pocket, and it runs once a
 * day behind a cron secret. So a key that is present but wrong, or an endpoint
 * that has moved, would look exactly like a quiet week with no recordings: no
 * error anybody sees, and a call that never arrives. This asks Pocket the same
 * question the poller asks and reports what came back.
 *
 * Read only on purpose. It lists, it counts, and it files nothing, so it can be
 * run as often as you like while setting the key up.
 */

const API = 'https://public.heypocketai.com/api/v1/public'

export const dynamic = 'force-dynamic'

type Listed = { id?: string; recording_at?: string; created_at?: string; title?: string }

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const apiKey = process.env.POCKET_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      reason: 'No POCKET_API_KEY is set on this deployment.',
    })
  }

  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)

  let listing: Response
  try {
    listing = await fetch(`${API}/recordings?start_date=${from}&limit=50`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    })
  } catch (problem) {
    return NextResponse.json({
      ok: false,
      reason: 'Could not reach Pocket at all.',
      detail: problem instanceof Error ? problem.message : String(problem),
    })
  }

  /*
   * The body is reported on a failure because the status alone does not
   * separate a wrong key from a moved endpoint, and those need different
   * fixes. Truncated, because a 404 from a CDN is an entire HTML page.
   */
  if (!listing.ok) {
    const body = await listing.text().catch(() => '')
    return NextResponse.json({
      ok: false,
      status: listing.status,
      reason:
        listing.status === 401 || listing.status === 403
          ? 'Pocket refused the key. Check it was copied whole, and that it has not been regenerated since.'
          : listing.status === 404
            ? 'Pocket does not recognise that endpoint. The API may have moved.'
            : 'Pocket returned an error.',
      detail: body.slice(0, 300),
    })
  }

  const payload = (await listing.json().catch(() => ({}))) as {
    data?: Listed[]
    recordings?: Listed[]
  }
  const recordings = payload.data ?? payload.recordings ?? []

  /*
   * The shape matters as much as the status. The poller reads `data` or
   * `recordings` and then an `id` on each row, so a two hundred carrying
   * neither would still file nothing, and saying so here is the whole point.
   */
  const shapeUnderstood = Array.isArray(payload.data) || Array.isArray(payload.recordings)

  return NextResponse.json({
    ok: true,
    status: listing.status,
    since: from,
    recordings: recordings.length,
    shapeUnderstood,
    withIds: recordings.filter((r) => r.id).length,
    latest: recordings
      .slice(0, 5)
      .map((r) => ({ on: (r.recording_at ?? r.created_at ?? '').slice(0, 10), title: r.title })),
    note: shapeUnderstood
      ? recordings.length
        ? 'The key works and recordings are visible.'
        : 'The key works, but Pocket has no recordings in the last thirty days.'
      : 'Pocket answered, but not in a shape this reads. The listing field may have been renamed.',
  })
}
