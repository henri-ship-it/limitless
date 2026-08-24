import { visualForEntry } from '@/content/journal-visuals'

/**
 * The artwork for an entry, sat square on a flat ground.
 *
 * Multiply blending drops the white of the printed page. The graphic itself is
 * held at half the panel so it has room to breathe rather than filling the box
 * edge to edge.
 */
export function JournalVisual({ entry, className = '' }: { entry: number; className?: string }) {
  const visual = visualForEntry(entry)
  if (!visual) return null

  return (
    <div className={`flex aspect-square w-full items-center justify-center bg-[#f1f1f1] ${className}`}>
      <img
        src={visual.src}
        alt=""
        width={visual.width}
        height={visual.height}
        loading="lazy"
        decoding="async"
        className="h-1/2 w-1/2 object-contain mix-blend-multiply"
      />
    </div>
  )
}
