import Link from 'next/link'
import type { DigestNode } from '@/content/digests'
import { DigestChecklist } from './DigestChecklist'

type Props = {
  nodes: DigestNode[]
  week: number
  /** First journal entry of the week, used to point practice at the right day. */
  firstEntry: number
  entriesInWeek: number
  completedItems: string[]
}

const FOCUS = /focus/i
const PRACTICE = /daily journal practice|journal practice/i
const QUESTIONS = /reflection question|questions to/i
const CHALLENGE = /challenge/i

/**
 * Renders a digest as Chris wrote it, in his order.
 *
 * A digest is mostly lists, and page after page of dots is hard to read, so the
 * list treatment is chosen from the heading it sits under. Focus points become
 * something to tick off, the daily practice is stepped through the week's
 * journal entries, reflection questions are set as questions, and a list of
 * "Label: explanation" pairs is set as a table of terms.
 */
export function DigestBody({ nodes, week, firstEntry, entriesInWeek, completedItems }: Props) {
  let heading = ''
  let sub = ''
  let focusCount = 0

  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === 'h') {
          heading = node.text
          sub = ''
          return (
            <h3 key={i} className="!mt-10 first:!mt-0">
              {node.text}
            </h3>
          )
        }

        if (node.type === 'sub') {
          sub = node.text
          return (
            <p key={i} className="!mb-2 !mt-6 !text-ink font-medium">
              {node.text}
            </p>
          )
        }

        if (node.type === 'p') {
          const afterList = nodes[i - 1]?.type === 'ul'
          return (
            <p key={i} className={afterList ? '!mt-8' : undefined}>
              {node.text}
            </p>
          )
        }

        const context = `${sub} ${heading}`

        if (FOCUS.test(context)) {
          const prefix = `w${week}:focus:${focusCount}`
          focusCount += 1
          return (
            <DigestChecklist
              key={i}
              keyPrefix={prefix}
              items={node.items}
              completed={completedItems}
            />
          )
        }

        if (PRACTICE.test(context)) {
          return (
            <PracticeList
              key={i}
              items={node.items}
              firstEntry={firstEntry}
              entriesInWeek={entriesInWeek}
            />
          )
        }

        if (QUESTIONS.test(context)) return <QuestionList key={i} items={node.items} />

        if (node.items.every((item) => /^[^:]{3,42}:\s/.test(item))) {
          return <TermList key={i} items={node.items} />
        }

        if (CHALLENGE.test(context)) return <PlainRows key={i} items={node.items} />

        return <PlainRows key={i} items={node.items} />
      })}
    </>
  )
}

/**
 * The week's practice, stepped across its journal entries. The mapping is by
 * position, since the copy names no entry numbers: the first practice belongs
 * to the first day, and so on. It stops pointing at days once the list runs
 * longer than the week does.
 */
function PracticeList({
  items,
  firstEntry,
  entriesInWeek,
}: {
  items: string[]
  firstEntry: number
  entriesInWeek: number
}) {
  const stepped = items.length <= entriesInWeek

  return (
    <ol className="!list-none !pl-0 !mb-0 border-t border-line">
      {items.map((item, i) => (
        <li key={item} className="!mb-0 flex items-center gap-4 border-b border-line py-3">
          {stepped ? (
            <Link
              href={`/journal/${firstEntry + i}`}
              className="pill !no-underline shrink-0 hover:border-line-strong hover:!text-ink"
            >
              Day {i + 1}
            </Link>
          ) : (
            <span className="label w-5 shrink-0 text-center">{i + 1}</span>
          )}
          <span className="text-[0.9375rem] leading-relaxed text-ink-72">{item}</span>
        </li>
      ))}
    </ol>
  )
}

function QuestionList({ items }: { items: string[] }) {
  return (
    <ul className="!list-none !pl-0 !mb-0 grid gap-px bg-line sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="!mb-0 bg-surface p-4">
          <p className="!mb-0 text-[0.9375rem] leading-relaxed !text-ink">{item}</p>
        </li>
      ))}
    </ul>
  )
}

/** A list of "Label: explanation" pairs, set as terms rather than dots. */
function TermList({ items }: { items: string[] }) {
  return (
    <dl className="!mb-0 border-t border-line">
      {items.map((item) => {
        const [term, ...rest] = item.split(':')
        return (
          <div
            key={item}
            className="grid gap-1 border-b border-line py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-5"
          >
            <dt className="label !text-ink pt-0.5">{term.trim()}</dt>
            <dd className="text-[0.9375rem] leading-relaxed text-ink-72">
              {rest.join(':').trim()}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/** The default: hairline rows, which read more calmly than a run of dots. */
function PlainRows({ items }: { items: string[] }) {
  return (
    <ul className="!list-none !pl-0 !mb-0 border-t border-line">
      {items.map((item) => (
        <li
          key={item}
          className="!mb-0 border-b border-line py-3 text-[0.9375rem] leading-relaxed text-ink-72"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}
