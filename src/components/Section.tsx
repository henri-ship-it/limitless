export function Section({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-line px-6 py-8 sm:px-10 sm:py-10">
      {label ? <p className="label mb-5">{label}</p> : null}
      <div className="prose-limitless">{children}</div>
    </section>
  )
}
