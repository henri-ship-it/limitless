type Visual = { src: string; width: number; height: number; scale: number }
type Caption = { lines: string[]; author?: string }

/**
 * The artwork for an entry, sat square on a flat ground.
 *
 * Multiply blending drops the white of the printed page. Some pages set their
 * quotation as outlines beneath the drawing, which cannot be read out of the
 * PDF, so that text is set here instead in the same mono capitals the book uses.
 */
export function JournalVisual({
  visual,
  caption,
  className = '',
}: {
  visual: Visual | null
  caption?: Caption | null
  className?: string
}) {
  if (!visual) return null

  const size = `${Math.round(visual.scale * 100)}%`

  return (
    <figure className={`!m-0 aspect-square w-full bg-[#f1f1f1] ${className}`}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-8">
        <img
          src={visual.src}
          alt=""
          width={visual.width}
          height={visual.height}
          loading="lazy"
          decoding="async"
          style={{ maxHeight: size, maxWidth: size }}
          className="object-contain mix-blend-multiply"
        />
        {caption && (caption.lines.length || caption.author) ? (
          <figcaption className="max-w-md text-center">
            {caption.lines.map((line, i) => (
              <p
                key={i}
                className="font-mono text-[0.6875rem] leading-[1.7] tracking-[0.06em] text-ink uppercase"
              >
                {line}
              </p>
            ))}
            {caption.author ? (
              <p className="label mt-4 !text-ink-40">{caption.author}</p>
            ) : null}
          </figcaption>
        ) : null}
      </div>
    </figure>
  )
}
