export function PageHeader({
  eyebrow,
  title,
  lede,
  pills,
}: {
  eyebrow?: string
  title: string
  lede?: string
  pills?: React.ReactNode
}) {
  return (
    <div className="border-b border-line px-6 py-12 sm:px-10 sm:py-16">
      {eyebrow ? <p className="label mb-4">{eyebrow}</p> : null}
      <h1 className="max-w-3xl text-[2.25rem] leading-[1.08] font-medium tracking-[-0.022em] sm:text-[2.75rem]">
        {title}
      </h1>
      {lede ? (
        <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-72">{lede}</p>
      ) : null}
      {pills ? <div className="mt-6 flex flex-wrap items-center gap-2">{pills}</div> : null}
    </div>
  )
}
