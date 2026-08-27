/**
 * Creates the cohort 4.0 members from a Kit export.
 *
 *   node scripts/import-members.mjs members.csv                  # dry run
 *   node scripts/import-members.mjs members.csv --commit
 *   node scripts/import-members.mjs pro.csv --tier=pro --commit
 *
 * The CSV needs an email column. Any header containing "email" is taken as the
 * address, so Kit's "Email Address" works as is.
 *
 * The tier is worked out in this order:
 *
 *   1. --tier=pro or --tier=core, if given. Use this when exporting one tag at
 *      a time, which is the simplest way out of Kit: one file per tier.
 *   2. A column containing "tier".
 *   3. A tags column mentioning Pro.
 *   4. Core, which is the safe default.
 *
 * Enrolment for 4.0 is closed, so this runs once rather than being wired to
 * Stripe. A member who signs in without a profile gets Core by default, which
 * is the safe way round.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * The service role key bypasses row level security, so keep it off the client.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const [file, ...flags] = process.argv.slice(2)
const commit = flags.includes('--commit')
const forcedTier = flags.find((f) => f.startsWith('--tier='))?.split('=')[1]

if (forcedTier && forcedTier !== 'pro' && forcedTier !== 'core') {
  console.error(`--tier must be pro or core, not "${forcedTier}"`)
  process.exit(1)
}

if (!file) {
  console.error('Usage: node scripts/import-members.mjs <members.csv> [--commit]')
  process.exit(1)
}

/** A small CSV reader. Handles quoted fields and embedded commas. */
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
      } else if (c === '"') {
        quoted = false
      } else {
        cell += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (c !== '\r') {
      cell += c
    }
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((v) => v.trim()))
}

const rows = parseCsv(readFileSync(file, 'utf8'))
const headers = rows[0].map((h) => h.trim().toLowerCase())

const emailAt = headers.findIndex((h) => h.includes('email'))
const tierAt = headers.findIndex((h) => h.includes('tier'))
const tagsAt = headers.findIndex((h) => h.includes('tag'))
const nameAt = headers.findIndex((h) => h.includes('first') || h === 'name')
const kitAt = headers.findIndex((h) => h.includes('subscriber'))

if (emailAt === -1) {
  console.error(`No email column found. Headers: ${headers.join(', ')}`)
  process.exit(1)
}

const members = rows.slice(1).map((row) => {
  const source = `${tierAt >= 0 ? row[tierAt] : ''} ${tagsAt >= 0 ? row[tagsAt] : ''}`
  return {
    email: row[emailAt].trim().toLowerCase(),
    first_name: nameAt >= 0 ? row[nameAt].trim() || null : null,
    tier: forcedTier ?? (/pro/i.test(source) ? 'pro' : 'core'),
    kit_subscriber_id: kitAt >= 0 ? row[kitAt].trim() || null : null,
  }
}).filter((m) => m.email.includes('@'))

const pro = members.filter((m) => m.tier === 'pro').length
console.log(`${members.length} members: ${pro} Pro, ${members.length - pro} Core`)
if (forcedTier) console.log(`(tier forced to ${forcedTier} for every row in this file)`)
else if (tierAt === -1 && tagsAt === -1) {
  console.log('\nNo tier or tags column found, so everyone above is Core.')
  console.log('If this file is one tag\'s export, re-run with --tier=pro or --tier=core.')
}
console.log(members.slice(0, 3).map((m) => `  ${m.tier.padEnd(4)} ${m.email}`).join('\n'))

if (!commit) {
  console.log('\nDry run. Re-run with --commit to create these members.')
  process.exit(0)
}

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const match = /^([A-Z_]+)=(.*)$/.exec(line.trim())
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

let created = 0
let existing = 0
const failures = []

for (const member of members) {
  // Creating the auth user first gives us the id that profiles hangs off.
  const { data, error } = await supabase.auth.admin.createUser({
    email: member.email,
    email_confirm: true,
    user_metadata: { first_name: member.first_name },
  })

  let id = data?.user?.id

  if (error) {
    if (!/already been registered|already exists/i.test(error.message)) {
      failures.push(`${member.email}: ${error.message}`)
      continue
    }
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    id = list?.users.find((u) => u.email === member.email)?.id
    existing += 1
    if (!id) {
      failures.push(`${member.email}: exists but could not be found`)
      continue
    }
  } else {
    created += 1
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id, ...member, cohort: '4.0' }, { onConflict: 'id' })

  if (profileError) failures.push(`${member.email}: ${profileError.message}`)
}

console.log(`\n${created} created, ${existing} already existed`)
if (failures.length) {
  console.log(`${failures.length} failed:`)
  for (const f of failures) console.log(`  ${f}`)
  process.exit(1)
}
