/**
 * Formatting shared between the server pages and the table that sorts them.
 *
 * Kept apart from admin.ts on purpose: that module reaches for cookies and the
 * service key, and importing it from a client component drags all of that into
 * the browser bundle.
 */

/** Reads as "3 days ago", or "never". */
export function since(iso: string | null): string {
  if (!iso) return 'never'
  const ms = Date.now() - Date.parse(iso)
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

/** Reads as "12m" or "1h 20m". */
export function readable(seconds: number): string {
  if (!seconds) return '—'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}
