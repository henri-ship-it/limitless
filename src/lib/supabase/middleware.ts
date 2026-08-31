import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseConfigured } from '../env'

const PUBLIC_PATHS = [
  '/sign-in',
  '/auth/confirm',
  '/auth/callback',
  '/auth/sign-out',
  /*
   * The installable bits, which the browser fetches on its own and often while
   * signed out. A service worker that answers with a redirect to the sign-in
   * page does not register at all, which quietly takes the whole thing down.
   */
  '/sw.js',
  '/manifest.webmanifest',
  '/offline.html',
  '/privacy',
  '/terms',
  // Webhooks carry a shared secret rather than a member session.
  '/api/webhooks',
]

export async function updateSession(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Refreshes the session cookie. Do not remove: without it the thirty day
  // session expires early on devices that only ever make server requests.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}
