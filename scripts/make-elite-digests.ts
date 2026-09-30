/**
 * Builds src/content/elite-digests.ts from the weekly digests, once.
 *
 *   npx tsx scripts/make-elite-digests.ts
 *
 * The twelve chapters of Elite are the twelve chapter weeks of the sixteen week
 * programme, in the same order and under the same titles, so the writing is the
 * same writing. What differs is the span: a chapter here is four weeks rather
 * than one, and the digest has to say so.
 *
 * Run once to lay the file down. After that elite-digests.ts is the source and
 * is edited by hand, because the wording changes are judgement rather than
 * substitution and rerunning this would undo them.
 */
import { writeFileSync, existsSync } from 'node:fs'
import { digests } from '../src/content/digests'
import { eliteChapters } from '../src/content/elite'

/** Chapter n of Elite is week CHAPTER_WEEKS[n - 1] of the weekly programme. */
const CHAPTER_WEEKS = [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15]

const target = 'src/content/elite-digests.ts'
if (existsSync(target) && !process.argv.includes('--force')) {
  console.error(`${target} already exists. It is hand-edited after the first run; pass --force to overwrite.`)
  process.exit(1)
}

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const out: string[] = [
  '// Laid down by scripts/make-elite-digests.ts from the weekly digests, then',
  '// edited by hand. Edit here: rerunning the script would undo the wording.',
  '//',
  '// The twelve chapters are the twelve chapter weeks of the sixteen week',
  '// programme, same order and same titles, so the writing is the same writing.',
  '// What changes is the span. A chapter here runs four weeks rather than one,',
  '// and anything that said "this week" had to be rewritten to say so.',
  '',
  "import type { DigestNode } from './digests'",
  '',
  'export type EliteDigest = {',
  '  chapter: number',
  '  nodes: DigestNode[]',
  '  quote?: { lines: string[]; author?: string }',
  '}',
  '',
  'export const eliteDigests: EliteDigest[] = [',
]

let made = 0
const missing: number[] = []

for (const chapter of eliteChapters) {
  const week = CHAPTER_WEEKS[chapter.n - 1]
  const digest = digests.find((d) => d.week === week)
  if (!digest) {
    missing.push(chapter.n)
    continue
  }
  made += 1
  out.push('  {')
  out.push(`    chapter: ${chapter.n},`)
  out.push('    nodes: [')
  for (const node of digest.nodes) {
    if (node.type === 'ul') {
      out.push(`      { type: 'ul', items: [${node.items.map(q).join(', ')}] },`)
    } else {
      out.push(`      { type: '${node.type}', text: ${q(node.text)} },`)
    }
  }
  out.push('    ],')
  if (digest.quote) {
    const author = digest.quote.author ? `, author: ${q(digest.quote.author)}` : ''
    out.push(`    quote: { lines: [${digest.quote.lines.map(q).join(', ')}]${author} },`)
  }
  out.push('  },')
}

out.push(']')
out.push('')
out.push('export function eliteDigest(chapter: number): EliteDigest | undefined {')
out.push('  return eliteDigests.find((d) => d.chapter === chapter)')
out.push('}')
out.push('')

writeFileSync(target, out.join('\n'))
console.log(`${made} of ${eliteChapters.length} chapters written to ${target}`)
if (missing.length) {
  console.log(`no weekly digest exists for chapter(s): ${missing.join(', ')}`)
}
