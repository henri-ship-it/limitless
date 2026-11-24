import { notFound } from 'next/navigation'

import { Assessment } from './Assessment'
import { ASSESSMENTS, assessmentFor } from '@/content/assessments'

/**
 * The assessments the printed journals point at.
 *
 * The slug is the path a QR code carries, so these routes are fixed: a book
 * already in somebody's hands cannot be reissued. Once the assessments domain
 * is pointed here, `unlock.lmntaryperformance.com/know-thyself` has to land on
 * this page.
 */
export function generateStaticParams() {
  return ASSESSMENTS.map((assessment) => ({ slug: assessment.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const assessment = assessmentFor(slug)
  return { title: assessment ? `${assessment.title} · Limitless` : 'Not found' }
}

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const assessment = assessmentFor(slug)
  if (!assessment) notFound()

  return <Assessment spec={assessment} />
}
