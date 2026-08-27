import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Signs a member in from the link in their email.
 *
 * This uses the token hash rather than the PKCE code flow, because a magic
 * link is very often requested on one device and opened on another: asked for
 * on a laptop, tapped in the mail app on a phone. PKCE keeps its verifier in a
 * cookie, so it only works when both happen in the same browser. A token hash
 * carries everything it needs and works anywhere.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = (searchParams.get('type') ?? 'email') as EmailOtpType
  const next = searchParams.get('next') ?? '/'

  if (tokenHash) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/sign-in?error=link`)
}
