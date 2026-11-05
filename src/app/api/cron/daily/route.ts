import { NextResponse } from 'next/server'
import { pullRecentCalls } from '@/lib/pocket'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Removes journal photographs once they are older than a week.
 *
 * The photograph is a means, not the record. What a member wrote is
 * transcribed into the entry within seconds of the shot being taken, and the
 * entry is what they read, search and are written to about. The image only
 * earns its keep for as long as somebody might want to check a line that came
 * out wrong, and in practice that is days rather than months.
 *
 * So the entries stay and the photographs do not. Left alone they would grow
 * without limit for no further benefit: fourteen members photographing all
 * hundred and twelve entries is most of the storage this project has.
 *
 * The files go first and the rows second. That order can only ever leave a row
 * pointing at a file that is gone, which the next run clears up. The other
 * order would leave a file that nothing points at, which nothing would find.
 */

const DAYS = 7
const BATCH = 100

export const dynamic = 'force-dynamic'

/*
 * Deletes the photographs past their week. Returns what it did, never throws:
 * the other half of this job has to run whatever happens here.
 *
 * Typed by what it uses rather than by the client, because the service client's
 * generic parameters differ from the request scoped one and naming either makes
 * this usable from one caller only.
 */
async function prunePhotos(supabase: {
  from: (table: string) => any
  storage: { from: (bucket: string) => { remove: (paths: string[]) => Promise<{ error: { message: string } | null }> } }
}) {
  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: stale, error } = await supabase
    .from('member_photos')
    .select('path')
    .lt('created_at', cutoff)
    .limit(BATCH)

  if (error) return { removed: 0, cutoff, error: error.message }
  if (!stale?.length) return { removed: 0, cutoff }

  const paths = (stale as { path: string }[]).map((row) => row.path)
  const { error: storageError } = await supabase.storage.from('journal-photos').remove(paths)
  if (storageError) return { removed: 0, cutoff, error: storageError.message }

  /*
   * Deleted by path, which is unique across the bucket, rather than by date.
   * A row written between the read above and this delete is then left for the
   * next run rather than being removed while its file is still in place.
   */
  const { error: rowError } = await supabase.from('member_photos').delete().in('path', paths)
  if (rowError) return { removed: 0, cutoff, error: rowError.message }

  return { removed: paths.length, cutoff }
}

/**
 * The one scheduled job, which does two things.
 *
 * Two, rather than two jobs, because the plan allows one a day. They have
 * nothing to do with each other beyond both wanting to happen daily, and
 * neither is allowed to stop the other: a pruning failure must not mean a
 * week's call never lands, and a Pocket outage must not mean photographs sit
 * in storage for a month.
 */
export async function GET(request: Request) {
  /*
   * Vercel signs its own cron requests with this. Without the secret set the
   * route refuses everybody, which is the right way round: a pruning job that
   * anybody can call is worse than one that never runs.
   */
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const photos = await prunePhotos(supabase)

  /*
   * The catch-up pass for the Wednesday call. The webhook is what normally
   * brings it in; this finds anything that push missed, which happens when a
   * deploy is mid-flight or a signature is misconfigured. Everything already on
   * file is skipped, so on almost every day this is one listing request and
   * nothing else.
   */
  const apiKey = process.env.POCKET_API_KEY
  const calls = apiKey
    ? await pullRecentCalls(supabase, {
        apiKey,
        anthropicKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-5',
      })
    : { checked: 0, results: [], error: 'No Pocket API key set.' }

  return NextResponse.json({ photos, calls })
}
