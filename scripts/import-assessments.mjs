/**
 * Pulls the assessment scores out of a Kit export onto each member's profile.
 *
 *   node scripts/import-assessments.mjs "Core 4.0.csv" "Pro 4.0.csv"
 *   node scripts/import-assessments.mjs *.csv --commit
 *
 * These are the pre-programme assessment, which writes its scores back to the
 * Kit subscriber, so the export already has a column per score. The Know Thyself
 * scorecard is a separate thing and arrives through the webhook instead.
 *
 * Only members who already exist are touched. Nobody is created here.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const commit = process.argv.includes('--commit')

if (!files.length) {
  console.error('Usage: node scripts/import-assessments.mjs <export.csv> [more.csv] [--commit]')
  process.exit(1)
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (c !== '\r') cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((v) => v.trim()))
}

/** Any column ending in "score" is one, whatever Kit called it. */
const isScore = (header) => /score\s*$/i.test(header.trim())

const collected = new Map()

for (const file of files) {
  const rows = parseCsv(readFileSync(file, 'utf8'))
  const headers = rows[0].map((h) => h.trim())
  const emailAt = headers.findIndex((h) => /email/i.test(h))
  if (emailAt === -1) {
    console.error(`${file}: no email column, skipped`)
    continue
  }

  const focusAt = headers.findIndex((h) => /improvement categories/i.test(h))
  const answersAt = headers.findIndex((h) => /improvement answers/i.test(h))

  for (const row of rows.slice(1)) {
    const email = (row[emailAt] ?? '').trim().toLowerCase()
    if (!email.includes('@')) continue

    const scores = {}
    headers.forEach((header, i) => {
      if (!isScore(header)) return
      const raw = (row[i] ?? '').trim()
      if (!raw) return
      const value = Number(raw)
      if (Number.isFinite(value)) {
        scores[header.replace(/\s*score\s*$/i, '').trim()] = value
      }
    })

    const focus = focusAt >= 0 ? (row[focusAt] ?? '').trim() : ''
    const answers = answersAt >= 0 ? (row[answersAt] ?? '').trim() : ''

    if (!Object.keys(scores).length && !focus && !answers) continue

    collected.set(email, {
      scores,
      focus: focus ? focus.split(',').map((s) => s.trim()).filter(Boolean) : [],
      wants: answers ? answers.split(',').map((s) => s.trim()).filter(Boolean) : [],
    })
  }
}

console.log(`${collected.size} members carry assessment data`)
for (const [email, data] of [...collected].slice(0, 3)) {
  console.log(`  ${email}: ${Object.keys(data.scores).length} scores, focus on ${data.focus.join(', ') || 'nothing recorded'}`)
}

if (!commit) {
  console.log('\nDry run. Re-run with --commit to write these onto the profiles.')
  process.exit(0)
}

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line.trim())
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

let written = 0
let missing = 0

for (const [email, preAssessment] of collected) {
  // Written under its own key so the scorecard, which arrives separately, does
  // not overwrite it.
  const { data: existing } = await supabase
    .from('profiles')
    .select('assessment')
    .eq('email', email)
    .single()

  const { data, error } = await supabase
    .from('profiles')
    .update({ assessment: { ...(existing?.assessment ?? {}), preAssessment } })
    .eq('email', email)
    .select('email')

  if (error) console.log(`  ${email}: ${error.message}`)
  else if (!data?.length) missing += 1
  else written += 1
}

console.log(`\n${written} profiles updated${missing ? `, ${missing} not on the platform` : ''}`)
