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
      <svg viewBox="0 0 48 56" className="h-14 w-12" fill="none" aria-hidden>
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
          transform-origin: 33px 22px;
          animation: lift 1.8s ease-in-out infinite;
        }
        .tumbler {
          transform-origin: 24px 33px;
          animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes lift {
          0%, 20%   { transform: translateY(0) rotate(0deg); }
          45%, 70%  { transform: translateY(-5px) rotate(14deg); }
          100%      { transform: translateY(0) rotate(0deg); }
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
