import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { MIN_MEMBERS, titlePatterns, worthReading } from '@/lib/pocket'

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

  /*
   * Listed with the verdict against each one, because the filter is the part
   * most worth seeing. Everything on the recorder shows up here, including the
   * calls that are none of the platform's business, and each says plainly
   * whether it would be filed. A private call marked `filed: true` is the one
   * thing on this page that needs acting on immediately.
   */
  const patterns = titlePatterns()
  const seen = recordings.map((r) => {
    const on = (r.recording_at ?? r.created_at ?? '').slice(0, 10)
    return {
      on,
      title: r.title ?? '(no title)',
      wouldOpen: worthReading({ title: r.title, happenedOn: on }, patterns),
    }
  })
  const wanted = seen.filter((r) => r.wouldOpen).length

  return NextResponse.json({
    ok: true,
    status: listing.status,
    since: from,
    recordings: recordings.length,
    shapeUnderstood,
    withIds: recordings.filter((r) => r.id).length,
    filesCallsOn: 'Wednesday',
    alsoOpensTitlesContaining: patterns,
    membersNeededOnIt: MIN_MEMBERS,
    wouldOpen: wanted,
    wouldSkip: seen.length - wanted,
    seen,
    note: !shapeUnderstood
      ? 'Pocket answered, but not in a shape this reads. The listing field may have been renamed.'
      : !recordings.length
        ? 'The key works, but Pocket has no recordings in the last thirty days.'
        : wanted
          ? `The key works. Only the Wednesday recordings above are opened, and one is filed only if at least ${MIN_MEMBERS} members are heard on it.`
          : 'The key works, but none of these happened on a Wednesday, so none would be opened. If the call moved, set POCKET_TITLE_MATCH to a phrase from its title.',
  })
}
