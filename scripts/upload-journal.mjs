/**
 * Puts the journal PDF in the private bucket the download route reads from.
 *
 *   node scripts/upload-journal.mjs "/path/to/LP_Limitless_Journal_Combined_01.pdf"
 *
 * The bucket is private, so /journal/download issues a ten minute signed URL
 * rather than linking the file directly. Re-running replaces the file.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/upload-journal.mjs <journal.pdf>')
  process.exit(1)
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

// Must match assets.journalPdf.storagePath in src/content/assets.ts.
const STORAGE_PATH = 'journal/LP_Limitless_Journal_Combined_01.pdf'

const supabase = createClient(url, key, { auth: { persistSession: false } })
const body = readFileSync(file)

const { error } = await supabase.storage
  .from('member-files')
  .upload(STORAGE_PATH, body, { contentType: 'application/pdf', upsert: true })

if (error) {
  console.error(`Upload failed: ${error.message}`)
  process.exit(1)
}

console.log(`Uploaded ${(body.length / 1024 / 1024).toFixed(1)}MB to member-files/${STORAGE_PATH}`)
