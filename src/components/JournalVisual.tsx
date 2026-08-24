import { visualForEntry } from '@/content/journal-visuals'

/**
 * The artwork for an entry, sat square on a flat ground. Multiply blending
 * drops the white of the printed page so the graphic sits on the panel rather
 * than in a white box.
 */
export function JournalVisual({ entry, className = '' }: { entry: number; className?: string }) {
  const visual = visualForEntry(entry)
  if (!visual) return null

  return (
    <div className={`aspect-square w-full bg-[#f1f1f1] p-6 sm:p-10 ${className}`}>
      <img
        src={visual.src}
        alt=""
        width={visual.width}
        height={visual.height}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain mix-blend-multiply"
      />
    </div>
  )
}
