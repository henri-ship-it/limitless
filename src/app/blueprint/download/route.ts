import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getMember } from '@/lib/member'
import { BLUEPRINT_BUCKET, blueprintPdfPath } from '@/content/blueprint'

/**
 * Issues a short lived signed URL for this member's blueprint PDF.
 *
 * The bucket has no select policy, so a member's own token cannot read it and
 * cannot sign anything in it. Authorisation happens here instead: the session
 * decides whether there is anything to fetch, and the path is built from the
 * session's own id rather than taken from the request, so there is no way to
 * ask for somebody else's. Only then does a service role client mint the URL.
 *
 * That is deliberately the opposite way round from the journal download, which
 * signs with the caller's own token because every member is entitled to the
 * same file.
 */
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  const member = await getMember()

  if (!member) return NextResponse.redirect(new URL('/sign-in?next=/blueprint', site))
  if (member.tier !== 'pro') return new NextResponse('Not found', { status: 404 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data, error } = await admin.storage
    .from(BLUEPRINT_BUCKET)
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
