import { notFound } from 'next/navigation'

import { Assessment } from './Assessment'
import { assessmentFor, assessmentPaths } from '@/content/assessments'
import { previewFor, previewsFor } from '@/content/assessment-previews'
import { supabaseConfigured } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

/**
 * The assessments the printed journals point at.
 *
 * The slug is the path a QR code carries, so these routes are fixed: a book
 * already in somebody's hands cannot be reissued. Once the assessments domain
 * is pointed here, `unlock.lmntaryperformance.com/know-thyself` has to land on
 * this page.
 *
 * Rendered per request rather than prebuilt, because the page needs to know
 * who is signed in before it decides whether to ask for an address.
 */
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return assessmentPaths().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const assessment = assessmentFor(slug)
  return { title: assessment ? `${assessment.title} · Limitless` : 'Not found' }
}

/**
 * Whoever is signed in, if anyone.
 *
 * Members take these from inside the platform, so the address is already
 * known and asking for it again is how the wrong one gets typed. It is read
 * here rather than in the browser so nobody can file a result against an
 * address that is not theirs.
 */
async function signedInEmail(): Promise<string | null> {
  if (!supabaseConfigured) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data.user?.email?.toLowerCase() ?? null
  } catch {
    return null
  }
}

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const assessment = assessmentFor(slug)
  if (!assessment) notFound()

  /*
   * `?preview=dynamo` opens straight on an example result, built from the
   * made-up scores in assessment-previews.ts. It is for looking at the page
   * without sitting the assessment: nothing is scored, stored or emailed, and
   * the page says so. An unknown value falls back to the first example.
   */
  const asked = (await searchParams).preview
  const key = Array.isArray(asked) ? asked[0] : asked
  const preview = key === undefined ? null : previewFor(slug, key || null)

  return (
    <Assessment
      spec={assessment}
      signedInAs={await signedInEmail()}
      preview={preview}
      previews={preview ? previewsFor(slug) : []}
    />
  )
}
