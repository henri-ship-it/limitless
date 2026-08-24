export function Section({
  id,
  label,
  children,
}: {
  id?: string
  label?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-line px-6 py-10 sm:px-10 sm:py-12">
      {label ? <p className="label mb-5">{label}</p> : null}
      <div className="prose-limitless">{children}</div>
    </section>
  )
}
