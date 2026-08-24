/**
 * The line a week closes on. Deliberately quiet: it sits inside the page
 * rather than shouting over it, and dialogue keeps its line breaks.
 */
export function Quote({ lines, author }: { lines: string[]; author?: string }) {
  if (!lines.length) return null

  return (
    <figure className="!mb-0 border-l-2 border-line-strong bg-ink-3 px-6 py-6 sm:px-8">
      <blockquote className="max-w-xl space-y-2">
        {lines.map((line) => (
          <p key={line} className="!mb-0 text-[1.0625rem] leading-[1.6] !text-ink">
            {line}
          </p>
        ))}
      </blockquote>
      {author ? <figcaption className="label mt-5">{author}</figcaption> : null}
    </figure>
  )
}
