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
