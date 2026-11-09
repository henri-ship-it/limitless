/**
 * Every box inside a group must render the answer written into it.
 *
 * A group hands each child field a path of its own, `3.1` for the second field
 * of the fourth group, and the child has to read the answer back from that
 * same path. It once read the group's path instead, which nothing ever writes
 * to, so on the two entries built out of groups every box stayed empty however
 * much was typed into it: the keystrokes were saved and the input never showed
 * them. Nothing else on the platform behaves that way, so nothing else caught
 * it.
 *
 * React.createElement rather than JSX because the project compiles JSX for
 * Next, and this has to run under plain tsx with the rest of the checks.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EntryField } from '../src/components/EntryField'
import { entryOverrides } from '../src/content/entry-overrides'
import type { Field } from '../src/content/entry-fields'

/** Fields that take an answer. A note is prose, and a group only holds others. */
const answerable = (f: Field) => f.kind !== 'note' && f.kind !== 'group'

let groups = 0
let boxes = 0
const failures: string[] = []

for (const [n, override] of Object.entries(entryOverrides)) {
  const fields = override.exercise?.fields
  if (!fields?.some((f) => f.kind === 'group')) continue

  /* An answer in every box, each one naming where it belongs. */
  const values: Record<string, string | string[]> = {}
  const expected: { path: string; text: string }[] = []

  fields.forEach((field, i) => {
    if (field.kind !== 'group') return
    groups += 1
    field.fields.forEach((child, j) => {
      if (!answerable(child)) return
      const path = `${i}.${j}`
      const text = `entry-${n}-box-${path}`
      values[path] = child.kind === 'lines' ? [text] : text
      expected.push({ path, text })
      boxes += 1
    })
  })

  const html = fields
    .map((field, i) =>
      renderToStaticMarkup(
        createElement(EntryField, { field, path: String(i), values, onChange: () => {} }),
      ),
    )
    .join('')

  for (const { path, text } of expected) {
    if (!html.includes(text)) failures.push(`entry ${n}, box ${path}`)
  }
}

console.log(`group fields: ${groups}, boxes inside them: ${boxes}`)

if (!groups) {
  console.error('FAIL: no entry uses a group, so this check proves nothing')
  process.exit(1)
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} box(es) did not render their own answer`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}

console.log('group fields: every box renders the answer at its own path')
