import type { ReactNode } from 'react'

/**
 * Turns the markdown links in a digest into real links.
 *
 * The digests are imported from Notion as plain strings, and Chris cites his
 * sources, so a line arrives reading "[Studies](https://pmc.ncbi.nlm.nih.gov/
 * articles/PMC3635495/) show that". Set as text that is what a member sees: a
 * URL through the middle of a sentence, which on a phone wraps into something
 * that looks broken rather than cited.
 *
 * Done here rather than by correcting the content, because digests.ts is
 * generated and any hand edit is lost the next time the importer runs. Any
 * link Chris writes from now on works without anybody remembering this.
 */

/** Deliberately narrow: a bracketed label and an http URL with no space in it. */
const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

export function linkify(text: string): ReactNode {
  // The overwhelming majority of lines have none, so leave those as a string.
  if (!text.includes('](')) return text

  const out: ReactNode[] = []
  let last = 0

  for (const match of text.matchAll(LINK)) {
    const at = match.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    out.push(
      <a key={at} href={match[2]} target="_blank" rel="noreferrer">
        {match[1]}
      </a>,
    )
    last = at + match[0].length
  }

  if (last < text.length) out.push(text.slice(last))
  return out
}
