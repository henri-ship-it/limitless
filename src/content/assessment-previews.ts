/**
 * Example results, so a result page can be looked at without sitting the
 * assessment.
 *
 * These are made-up scores, not anybody's sitting. They exist so the page can
 * be reviewed, shown to a cohort before a chapter, or checked after a change,
 * without forty questions first and without putting a fake result on a real
 * profile. Nothing here is written to the database: the preview renders the
 * result stage straight from these numbers.
 *
 * They are shaped to look like real sittings rather than round demonstrations.
 * Each one sits near the group medians recorded in know-thyself-norms.ts and
 * light-the-fire-copy.ts, with one category clearly out in front so the lead
 * is unambiguous, and the spread differs between them so the radar does not
 * draw the same shape four times.
 *
 * Know Thyself leads on the highest score. Light The Fire leads on the
 * **lowest**, so its examples are named after the component somebody is
 * shortest of.
 */

export type Preview = {
  /** The query value, as in ?preview=dynamo. */
  key: string
  /** What the example shows, for the chooser at the top of the page. */
  label: string
  scores: Record<string, number>
}

const KNOW_THYSELF: Preview[] = [
  {
    key: 'dynamo',
    label: 'Leads with Dynamo',
    // Wide spread, Energiser well below the group. The spiked radar.
    scores: { Dynamo: 87, Analyst: 70, Caretaker: 61, Energiser: 50 },
  },
  {
    key: 'analyst',
    label: 'Leads with Analyst',
    scores: { Analyst: 83, Caretaker: 74, Dynamo: 63, Energiser: 48 },
  },
  {
    key: 'caretaker',
    label: 'Leads with Caretaker',
    // The even one, and the only example that sits above the median on all four.
    scores: { Caretaker: 85, Energiser: 76, Analyst: 72, Dynamo: 67 },
  },
  {
    key: 'energiser',
    label: 'Leads with Energiser',
    scores: { Energiser: 89, Dynamo: 78, Caretaker: 65, Analyst: 54 },
  },
]

const LIGHT_THE_FIRE: Preview[] = [
  {
    key: 'control',
    label: 'Shortest on Control',
    scores: { Control: 52, Competence: 79, Connectedness: 83 },
  },
  {
    key: 'competence',
    label: 'Shortest on Competence',
    scores: { Control: 81, Competence: 57, Connectedness: 76 },
  },
  {
    key: 'connectedness',
    label: 'Shortest on Connectedness',
    scores: { Control: 74, Competence: 78, Connectedness: 45 },
  },
]

/** Keyed by the slugs the QR codes carry, plus the chapter-one alias. */
const BY_SLUG: Record<string, Preview[]> = {
  'know-thyself': KNOW_THYSELF,
  'know-thyself-chapter-01': KNOW_THYSELF,
  'light-the-fire': LIGHT_THE_FIRE,
}

/** Every example for an assessment, in the order they should be offered. */
export function previewsFor(slug: string): Preview[] {
  return BY_SLUG[slug] ?? []
}

/**
 * One example by its query value.
 *
 * `?preview` on its own, or with a value that is not an example, falls back to
 * the first, so a mistyped link still shows something rather than the intro.
 */
export function previewFor(slug: string, key: string | null): Preview | null {
  const previews = previewsFor(slug)
  if (!previews.length) return null
  if (!key) return previews[0]
  return previews.find((preview) => preview.key === key.toLowerCase()) ?? previews[0]
}
