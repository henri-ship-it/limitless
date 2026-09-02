import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMember } from '@/lib/member'
import { blueprintPdfPath } from '@/content/blueprint'

/**
 * Issues a short lived signed URL for this member's blueprint PDF and
 * redirects to it, the same way the journal download works. The bucket is
 * private, and the path is derived from the session rather than taken from
 * the request, so nobody can ask for somebody else's.
 */
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  const member = await getMember()

  if (!member) return NextResponse.redirect(new URL('/sign-in?next=/blueprint', site))
  if (member.tier !== 'pro') return new NextResponse('Not found', { status: 404 })

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('member-files')
    .createSignedUrl(blueprintPdfPath(member.id), 60 * 10, {
      download: 'Limitless Pro Blueprint.pdf',
    })

  if (error || !data) {
    return NextResponse.json(
      { error: 'The PDF is not ready yet. Your blueprint is still readable on the page.' },
      { status: 404 },
    )
  }

  return NextResponse.redirect(data.signedUrl)
}
