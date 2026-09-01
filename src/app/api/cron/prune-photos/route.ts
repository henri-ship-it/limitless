import { NextResponse } from 'next/server'
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

  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: stale, error } = await supabase
    .from('member_photos')
    .select('path')
    .lt('created_at', cutoff)
    .limit(BATCH)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!stale?.length) {
    return NextResponse.json({ removed: 0, cutoff })
  }

  const paths = stale.map((row) => row.path)
  const { error: storageError } = await supabase.storage.from('journal-photos').remove(paths)
  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  /*
   * Deleted by path, which is unique across the bucket, rather than by date.
   * A row written between the read above and this delete is then left for the
   * next run rather than being removed while its file is still in place.
   */
  const { error: rowError } = await supabase.from('member_photos').delete().in('path', paths)
  if (rowError) {
    return NextResponse.json({ error: rowError.message }, { status: 500 })
  }

  return NextResponse.json({ removed: paths.length, cutoff })
}
