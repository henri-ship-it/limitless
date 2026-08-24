import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assets } from '@/content/assets'

/**
 * Issues a short lived signed URL for the journal PDF and redirects to it. The
 * bucket is private, so this is the only way a member reaches the file.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_SITE_URL))

  const { data, error } = await supabase.storage
    .from('member-files')
    .createSignedUrl(assets.journalPdf.storagePath, 60 * 10, {
      download: assets.journalPdf.filename,
    })

  if (error || !data) {
    return NextResponse.json(
      { error: 'The journal PDF is not available yet. Reply to any email from Chris.' },
      { status: 404 },
    )
  }

  return NextResponse.redirect(data.signedUrl)
}
