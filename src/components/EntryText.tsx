import Link from 'next/link'

/**
 * Prose from the journal, with any reference to another entry turned into a
 * link to it. The book expects you to flick back, so the screen should too.
 */
export function EntryText({ text }: { text: string }) {
  const parts = text.split(/(\(?Entry \d+\)?)/g)

  return (
    <>
      {parts.map((part, i) => {
        const match = /^\(?Entry (\d+)\)?$/.exec(part)
        if (!match) return part
        return (
          <Link key={i} href={`/journal/${match[1]}`} className="underline underline-offset-2">
            {part}
          </Link>
        )
      })}
    </>
  )
}
