type Visual = { src: string; width: number; height: number; scale: number }
type Caption = { lines: string[]; author?: string }

/** The diagrams are rendered at three times their size on the page. */
const RENDER_SCALE = 3
/** Blender Pro Bold, 12pt on the page. Medium, 10pt, for the attribution. */
const CAPTION_PT = 12
const AUTHOR_PT = 10

/**
 * The artwork for an entry, sat square on a flat ground.
 *
 * Multiply blending drops the white of the printed page. Where the book sets a
 * caption as outlines, the crop keeps it and nothing is added here. Where the
 * caption is live text that falls outside the crop, it is set below in Blender
 * Pro at the size the page uses, scaled with the diagram so it matches the
 * lettering inside it.
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
  const hasCaption = Boolean(caption && (caption.lines.length || caption.author))

  /*
   * How wide a point on the printed page is here, as a fraction of the panel.
   *
   * `scale` caps both sides of the image, so the crop fits inside a square of
   * that size rather than filling its width. A wide crop is held by its width
   * and does fill it; a tall one is held by its height and comes out narrower
   * by its aspect ratio.
   *
   * Reading `scale` as the rendered width regardless made the caption on a
   * tall crop too big by exactly the amount the image had shrunk. Entry 20 is
   * a narrow column of words and was the worst of it, nearly twice the size it
   * should have been, in the thumbnail and on the page alike.
   */
  const sourcePt = visual.width / RENDER_SCALE
  const renderedWidth = visual.scale * Math.min(1, visual.width / visual.height) * 100
  const perPoint = renderedWidth / sourcePt

  return (
    /*
     * m-0 without the important flag on purpose. It was !m-0, which beat every
     * margin a caller passed in and quietly held the artwork against whatever
     * sat above it, however much room the page asked for.
     */
    <figure className={`m-0 aspect-square w-full bg-[#f1f1f1] [container-type:inline-size] ${className}`}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-[7%] px-10 py-10">
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
        {hasCaption ? (
          <figcaption
            className="max-w-[80%] text-center"
            style={{ fontFamily: 'var(--font-caption)' }}
          >
            {caption!.lines.map((line, i) => (
              <p
                key={i}
                className="font-bold uppercase text-ink"
                style={{
                  fontSize: `clamp(0.75rem, ${(perPoint * CAPTION_PT).toFixed(3)}cqw, 2rem)`,
                  lineHeight: 1.25,
                }}
              >
                {line}
              </p>
            ))}
            {caption!.author ? (
              <p
                className="mt-[1.4em] font-medium uppercase text-ink-40"
                style={{
                  fontSize: `clamp(0.625rem, ${(perPoint * AUTHOR_PT).toFixed(3)}cqw, 1.667rem)`,
                  letterSpacing: '0.04em',
                }}
              >
                {caption!.author}
              </p>
            ) : null}
          </figcaption>
        ) : null}
      </div>
    </figure>
  )
}
