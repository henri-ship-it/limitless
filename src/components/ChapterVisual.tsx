import { chapterVisual } from '@/content/chapter-visuals'

/**
 * The diagram that faces the chapter introduction in the printed journal. Its
 * quotation is set into the artwork, so nothing is added underneath.
 */
export function ChapterVisual({ week }: { week: number }) {
  const visual = chapterVisual(week)
  if (!visual) return null

  return (
    <div className="!my-10 flex aspect-[4/3] w-full items-center justify-center bg-[#f1f1f1]">
      <img
        src={visual.src}
        alt=""
        width={visual.width}
        height={visual.height}
        loading="lazy"
        decoding="async"
        className="h-3/5 w-3/5 object-contain mix-blend-multiply"
      />
    </div>
  )
}
