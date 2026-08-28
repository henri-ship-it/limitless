/**
 * The loading state.
 *
 * A padlock shackle lifting clear of its body, drawn in the same hairline the
 * rest of the interface uses. It borrows the padlock from the locked weeks, so
 * waiting for a page reads as the same idea as a chapter opening rather than a
 * decoration bolted on.
 */
export function Unlocking({ label = 'Unlocking' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6" role="status">
      <svg viewBox="-14 -12 76 72" className="h-20 w-20" fill="none" aria-hidden>
        <g
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* The shackle lifts, tilts open, and settles back. */}
          <path d="M15 22V14a9 9 0 0 1 18 0v8" className="shackle" />
          <rect x="8" y="22" width="32" height="26" rx="3" />
        </g>
        <circle cx="24" cy="33" r="3" fill="var(--color-accent)" className="tumbler" />
      </svg>

      <p className="label">{label}</p>

      <style>{`
        .shackle {
          /* Hinged on the right leg, so it swings out rather than lifting. */
          transform-origin: 33px 22px;
          animation: swing 2.2s ease-in-out infinite;
        }
        .tumbler {
          transform-origin: 24px 33px;
          animation: pulse 2.2s ease-in-out infinite;
        }
        @keyframes swing {
          0%, 15%   { transform: rotate(0deg); }
          50%, 72%  { transform: rotate(58deg); }
          100%      { transform: rotate(0deg); }
        }
        @keyframes pulse {
          0%, 20%   { opacity: 0.15; transform: scale(0.7); }
          50%       { opacity: 1; transform: scale(1); }
          100%      { opacity: 0.15; transform: scale(0.7); }
        }
        @media (prefers-reduced-motion: reduce) {
          .shackle, .tumbler { animation: none; }
          .tumbler { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
