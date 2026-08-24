// Weekly digest bodies, sectioned to match the shape Chris writes them in.
//
// These are seeded from the Kit broadcast export (limitless-digests-export.md).
// Run `npm run import:digests -- path/to/limitless-digests-export.md` to fill
// this file. Until then every week renders its journal chapter opening and the
// masterclass, and the digest sections are simply omitted.
//
// House style when editing: British English, no em dashes, no semicolons,
// no rhetorical questions outside the reflection prompts. Sign off as 'Chris'.

export type KeyInsight = { title: string; body: string }

export type Digest = {
  week: number
  subject: string
  /** Two to six short paragraphs setting up the chapter. */
  opening: string[]
  /** What the framework helps you do. Three to five bullets. */
  focus: string[]
  keyInsights: KeyInsight[]
  implementation?: {
    dailyPractice: string[]
    weeklyChallenge: string
    reflectionQuestions: string[]
  }
  /** The research behind the chapter. */
  science?: { title: string; body: string[]; link?: { label: string; url: string } }
  /** Ties the week back to earlier weeks. */
  progressCheck?: string[]
  lookingAhead?: string[]
  remember?: string
}

export const digests: Digest[] = []

export function getDigest(week: number): Digest | undefined {
  return digests.find((d) => d.week === week)
}
