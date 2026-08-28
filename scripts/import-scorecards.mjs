/**
 * Files a ScoreApp CSV export against members, as the webhook would.
 *
 * The webhook only fires on new completions, so anyone who answered before it
 * was wired up has a blank tab. This backfills them from the export, using the
 * same slots and the same shape, so a backfilled profile is indistinguishable
 * from a live one.
 *
 *   node --env-file=.env.local scripts/import-scorecards.mjs <csv> <type>
 *
 * where type is know-thyself or pre-assessment. Add --dry to see what it would
 * do without writing anything.
 *
 * People do not always answer from the address they enrolled with, which is the
 * one case the webhook cannot resolve on its own. --as <email> files every row
 * in the export against that member instead of the address in the file, so use
 * it on a single row export and check who you are pointing it at.
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SLOTS = { 'know-thyself': 'scorecard', 'pre-assessment': 'preAssessment' }

/** Columns ScoreApp puts before the answers, none of which are worth filing. */
const METADATA = new Set([
  'first_name',
  'last_name',
  'email',
  'scorecard_started_at',
  'scorecard_finished_at',
  'time_taken',
  'completed',
  'optin',
  'optin_detail',
  'utm_source',
  'utm_campaign',
  'utm_medium',
  'utm_term',
  'utm_content',
  'result_key',
  'result_url',
  'result_pdf_url',
  'referrer',
  'landing_page',
  'ip_address_country',
])

/**
 * Reads CSV with quoted fields, embedded commas and embedded newlines, which
 * the free-text answers reliably contain.
 */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\r') {
      // Ignore; the newline that follows ends the row.
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim()))
}

function read(headers, cells, slot) {
  const scores = {}
  const notes = {}

  headers.forEach((header, i) => {
    const name = header.trim()
    const value = (cells[i] ?? '').trim()
    if (!name || !value || METADATA.has(name)) return

    // "Personal Context Score %" is the percentage; the "- Actual" pair beside
    // it is the raw points, which means nothing without the maximum.
    if (name.endsWith('Score - Actual')) return
    if (name.endsWith('Score %')) {
      const label = name.replace(/\s*Score %$/, '').trim()
      const percent = Number(value)
      if (Number.isFinite(percent)) scores[label === 'Overall' ? 'Overall' : label] = percent
      return
    }

    // Know Thyself files its scores only; its questions are the mechanism.
    if (slot === 'scorecard') return

    notes[name] = value
  })

  return { scores, notes }
}

const [csvPath, type] = process.argv.slice(2)
const dry = process.argv.includes('--dry')
const asIndex = process.argv.indexOf('--as')
const forced = asIndex === -1 ? null : process.argv[asIndex + 1]?.trim().toLowerCase()

if (!csvPath || !SLOTS[type]) {
  console.error('Usage: node --env-file=.env.local scripts/import-scorecards.mjs <csv> <know-thyself|pre-assessment> [--dry]')
  process.exit(1)
}

const slot = SLOTS[type]
const rows = parseCsv(readFileSync(csvPath, 'utf8'))
const [headers, ...body] = rows
const emailAt = headers.findIndex((h) => h.trim() === 'email')
const finishedAt = headers.findIndex((h) => h.trim() === 'scorecard_finished_at')

if (emailAt === -1) {
  console.error('No email column in that export.')
  process.exit(1)
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

for (const cells of body) {
  const answered = (cells[emailAt] ?? '').trim().toLowerCase()
  const email = forced ?? answered
  if (!email) continue
  if (forced && forced !== answered) {
    console.log(`filing ${answered} against ${forced}`)
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id, first_name, assessment')
    .eq('email', email)
    .maybeSingle()

  if (!profile) {
    console.log(`skipped  ${email} - not a member`)
    continue
  }

  const { scores, notes } = read(headers, cells, slot)
  const held = profile.assessment ?? {}

  if (held[slot]) {
    // The webhook has already filed a live one. That is the better record.
    console.log(`skipped  ${email} - already has a ${type}`)
    continue
  }

  const finished = (cells[finishedAt] ?? '').trim()
  const receivedAt = finished ? new Date(finished.replace(' ', 'T') + 'Z').toISOString() : new Date().toISOString()

  console.log(
    `${dry ? 'would file' : 'filed'}   ${profile.first_name ?? email} - ${Object.keys(scores).length} scores, ${Object.keys(notes).length} answers`,
  )

  if (dry) continue

  const { error } = await db
    .from('profiles')
    .update({ assessment: { ...held, [slot]: { scores, notes, receivedAt } } })
    .eq('id', profile.id)

  if (error) console.error(`  failed: ${error.message}`)
}
