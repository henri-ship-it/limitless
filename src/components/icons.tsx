export function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden
    >
      <rect x="2.5" y="5.25" width="7" height="5.25" rx="1" />
      <path d="M4.25 5.25V3.75a1.75 1.75 0 0 1 3.5 0v1.5" />
    </svg>
  )
}

export function TickIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2.5 6.25 5 8.75l4.5-5.5" />
    </svg>
  )
}

export function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3.25 4.75 6 7.5l2.75-2.75" />
    </svg>
  )
}

/** The live week marker. A slow radar pulse, then the word. */
export function NowIndicator() {
  return (
    <span className="flex items-center gap-2">
      <span className="radar" aria-hidden />
      <span className="label !text-accent">Now</span>
    </span>
  )
}

/*
 * The sidebar's five top-level marks.
 *
 * One weight, one size, drawn on the same sixteen unit grid so they read as a
 * set rather than as five borrowed glyphs. They inherit their colour from the
 * link, so an active item darkens its icon along with its label.
 */
type NavIcon = { className?: string }

const nav = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.35,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Start Guide. An open book. */
export function GuideIcon({ className = '' }: NavIcon) {
  return (
    <svg {...nav} className={`h-4 w-4 ${className}`} aria-hidden>
      <path d="M8 5.1S6.9 3.6 4.2 3.6H2.1v8h2.1C6.9 11.6 8 13.1 8 13.1" />
      <path d="M8 5.1s1.1-1.5 3.8-1.5h2.1v8h-2.1C9.1 11.6 8 13.1 8 13.1" />
    </svg>
  )
}

/** Journal. A pen, because the journal is a thing you write in. */
export function JournalIcon({ className = '' }: NavIcon) {
  return (
    <svg {...nav} className={`h-4 w-4 ${className}`} aria-hidden>
      <path d="M11.3 2.4l2.3 2.3-8 8-3 .7.7-3z" />
      <path d="M9.9 3.8l2.3 2.3" />
    </svg>
  )
}

/** Pro. A star, for the tier. */
export function ProIcon({ className = '' }: NavIcon) {
  return (
    <svg {...nav} className={`h-4 w-4 ${className}`} aria-hidden>
      <path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.5l4-.6z" />
    </svg>
  )
}

/** Admin. Two people, since the view is the cohort. */
export function AdminIcon({ className = '' }: NavIcon) {
  return (
    <svg {...nav} className={`h-4 w-4 ${className}`} aria-hidden>
      <circle cx="6.1" cy="5.6" r="2.3" />
      <path d="M1.9 13.3c0-2.3 1.9-3.7 4.2-3.7s4.2 1.4 4.2 3.7" />
      <path d="M11 3.6a2.3 2.3 0 0 1 0 4.1M11.6 9.8c1.6.3 2.5 1.6 2.5 3.5" />
    </svg>
  )
}

/** Your account. One person. */
export function AccountIcon({ className = '' }: NavIcon) {
  return (
    <svg {...nav} className={`h-4 w-4 ${className}`} aria-hidden>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3.4 13.4c0-2.5 2.1-3.9 4.6-3.9s4.6 1.4 4.6 3.9" />
    </svg>
  )
}

/** Photographing a page of the printed journal. */
export function CameraIcon({ className = '' }: NavIcon) {
  return (
    <svg {...nav} className={`h-4 w-4 ${className}`} aria-hidden>
      <path d="M2 5.6h2.6l1-1.6h4.8l1 1.6H14v7.2H2z" />
      <circle cx="8" cy="9.1" r="2.3" />
    </svg>
  )
}
