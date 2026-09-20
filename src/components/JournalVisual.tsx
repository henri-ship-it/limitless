type Visual = { src: string; width: number; height: number; scale: number }
type Caption = { lines: string[]; author?: string }

/*
 * Caption size, as a share of the panel rather than of the artwork.
 *
 * This used to be worked out from the crop's own width, on the idea that a
 * caption should match the lettering inside the diagram. In practice the crops
 * run from 268px to 1284px wide, so the same twelve point caption came out at
 * anything from five pixels to seventeen, and two thumbnails side by side had
 * visibly different captions. The caption is display text sitting under the
 * picture, not part of it, so it belongs to the panel.
 */
const CAPTION_CQW = 3
const AUTHOR_CQW = 2.5

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
  compact = false,
  className = '',
}: {
  visual: Visual | null
  caption?: Caption | null
  /**
   * A small panel, such as the journal index. The caption's line breaks are
   * set for the width of the page and break again when the panel is narrow,
   * which strands two or three words on a line of their own. Here the lines
   * are run together and left to wrap where they will.
   */
  compact?: boolean
  className?: string
}) {
  if (!visual) return null

  const size = `${Math.round(visual.scale * 100)}%`
  const hasCaption = Boolean(caption && (caption.lines.length || caption.author))

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
            {(compact ? [caption!.lines.join(' ')] : caption!.lines).map((line, i) => (
              <p
                key={i}
                className="font-bold uppercase text-ink"
                style={{
                  fontSize: `clamp(0.75rem, ${CAPTION_CQW}cqw, 2rem)`,
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
                  fontSize: `clamp(0.625rem, ${AUTHOR_CQW}cqw, 1.667rem)`,
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
