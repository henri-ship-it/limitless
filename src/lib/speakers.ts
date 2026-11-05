/**
 * Matching a name on a recording to a member on the platform.
 *
 * Kept apart from the webhook because this is where it fails quietly. A speaker
 * nobody matches is not an error: the call is ingested, nothing goes red, and
 * that member simply never receives any of it. The opposite is worse. Matching
 * two members to one voice files somebody else's words under their name, and
 * every message they get afterwards is built on it.
 *
 * Labels come from whatever somebody typed into the recorder once, so they are
 * "Chaz" and "Bry" as often as they are the name on the account. A member can
 * carry the label they are actually known by in recording_name.
 */
export type Speaker = {
  id: string
  firstName: string | null
  recordingName: string | null
}

/**
 * Whether a label on a recording is this person.
 *
 * A prefix match, because the labels are shortenings and the shortening is
 * nearly always the start of the name. Three characters is the floor: below it
 * "Chr" would take Chris and Christine with equal confidence, and a wrong match
 * here is much more expensive than a missed one.
 */
export function sameName(label: string, name: string): boolean {
  const a = label.trim().toLowerCase()
  const b = name.trim().toLowerCase()
  if (!a || !b) return false
  if (a === b) return true

  const shorter = a.length < b.length ? a : b
  const longer = a.length < b.length ? b : a
  return shorter.length >= 3 && longer.startsWith(shorter)
}

/**
 * The one member a label belongs to, or null.
 *
 * Null when nobody matches and null when more than one does, because an
 * ambiguous match is the case that files a member's words under somebody else.
 * A recording_name beats a first name: it is there precisely because the first
 * name was not what the recorder heard.
 */
export function matchSpeaker<T extends Speaker>(label: string, people: T[]): T | null {
  const byRecordingName = people.filter(
    (p) => p.recordingName && sameName(label, p.recordingName),
  )
  if (byRecordingName.length === 1) return byRecordingName[0]
  if (byRecordingName.length > 1) return null

  const byFirstName = people.filter((p) => p.firstName && sameName(label, p.firstName))
  return byFirstName.length === 1 ? byFirstName[0] : null
}
