import { isBlueprint, type Blueprint } from '@/content/blueprint'

/**
 * A Pro member's blueprint, read from the admin side.
 *
 * The same document they read on their own page, set tighter. Chris writes
 * these out of the welcome call and then needs them back at his elbow months
 * later, halfway through drafting a message, without opening a second window
 * and pretending to be them.
 *
 * Core members do not have one and never will, so nothing is rendered for
 * them rather than an empty frame promising something that is not coming.
 */
export function TheirBlueprint({ filled, tier }: { filled: unknown; tier: string }) {
  if (tier !== 'pro') return null

  if (!isBlueprint(filled)) {
    return (
      <div className="mt-8 border-t border-line pt-6">
        <p className="label !mb-2">Their blueprint</p>
        <p className="!mb-0 text-[0.9375rem] !text-ink-56">
          Not written yet. It comes out of the welcome call.
        </p>
      </div>
    )
  }

  const b = filled as Blueprint

  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="!mb-5 flex flex-wrap items-center gap-2">
        <span className="label">Their blueprint</span>
        {b.issuedAt ? (
          <span className="pill">
            Issued{' '}
            {new Date(b.issuedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        ) : null}
        {b.territory.direction.map((word) => (
          <span key={word} className="pill !text-ink">
            {word}
          </span>
        ))}
      </div>

      <Block label="The challenge">{b.territory.challenge}</Block>

      <div className="!mb-6">
        <p className="label !mb-2 !text-ink-56">Resistance</p>
        <dl className="!mb-0 grid gap-3 sm:grid-cols-2">
          {b.resistance.rows.map((row, i) => (
            <div key={i} className="border border-line p-4">
              <dt className="!mb-1.5 text-[0.9375rem] font-medium text-ink">{row.title}</dt>
              <dd className="!mb-0 text-[0.875rem] leading-relaxed text-ink-72">{row.watchFor}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 !mb-0 text-[0.9375rem] leading-relaxed text-ink-72">
          Moving from <span className="text-ink">{b.resistance.shiftFrom}</span> to{' '}
          <span className="text-ink">{b.resistance.shiftTo}</span>.
        </p>
      </div>

      <div className="!mb-6">
        <p className="label !mb-2 !text-ink-56">Their journey</p>
        <dl className="!mb-0">
          {b.journey.map((stage) => (
            <div
              key={stage.stage}
              className="grid gap-1 border-t border-line py-2.5 sm:grid-cols-[7rem_1fr] sm:gap-5"
            >
              <dt className="label !text-ink">{stage.stage}</dt>
              <dd className="!mb-0 text-[0.9375rem] leading-relaxed text-ink-72">
                <span className="text-ink">{stage.title}.</span> {stage.relevance}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <List label="Strengths" items={b.integration.strengths} />
        <List label="Opportunities" items={b.integration.opportunities} />
      </div>
    </div>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="!mb-6">
      <p className="label !mb-2 !text-ink-56">{label}</p>
      <p className="!mb-0 text-[0.9375rem] leading-relaxed text-ink-72">{children}</p>
    </div>
  )
}

function List({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="label !mb-2 !text-ink-56">{label}</p>
      <ul className="!mb-0 !list-none !pl-0 flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-[0.9375rem] leading-relaxed text-ink-72">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
