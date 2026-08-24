export function PageHeader({
  eyebrow,
  title,
  meta,
}: {
  eyebrow?: string
  title: string
  meta?: React.ReactNode
}) {
  return (
    <div className="border-b border-line px-6 py-8 sm:px-10 sm:py-12">
      {eyebrow ? <p className="label mb-4">{eyebrow}</p> : null}
      <h1 className="max-w-3xl text-[1.875rem] font-bold leading-[1.2] tracking-[-0.025em] sm:text-[2.25rem]">
        {title}
      </h1>
      {meta ? <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">{meta}</div> : null}
    </div>
  )
}
