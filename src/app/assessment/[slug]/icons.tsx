/**
 * A few Hugeicons, inlined.
 *
 * Inline rather than hosted files so they take currentColor, stay crisp at any
 * size and cost no request. Every one is decorative: the heading beside it
 * says the same thing in words, so they are hidden from screen readers.
 */

type Props = { className?: string }

export function MirrorIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M7 15V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V15C17 16.6547 16.6547 17 15 17H9C7.34533 17 7 16.6547 7 15Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6L11 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8.5L13 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 8V22M4 8V22" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20H20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12H7M17 12H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckmarkIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" />
      <path d="M8 12.5L10.5 15L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AlertIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M13.9248 21H10.0752C5.44476 21 3.12955 21 2.27636 19.4939C1.42317 17.9879 2.60736 15.9914 4.97574 11.9985L6.90057 8.75333C9.17559 4.91778 10.3131 3 12 3C13.6869 3 14.8244 4.91777 17.0994 8.75332L19.0243 11.9985C21.3926 15.9914 22.5768 17.9879 21.7236 19.4939C20.8704 21 18.5552 21 13.9248 21Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17V13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9.25H12.125M12.25 9.25C12.25 9.11193 12.1381 9 12 9C11.8619 9 11.75 9.11193 11.75 9.25C11.75 9.38807 11.8619 9.5 12 9.5C12.1381 9.5 12.25 9.38807 12.25 9.25Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CompassIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="13" r="9" strokeLinecap="round" />
      <path d="M12 3.5V2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 2H14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.7728 10.2571C15.5061 10.9837 14.3328 16.8933 13.1289 16.9974C12.1189 17.0848 11.8041 15.0928 11.5914 14.4614C11.3815 13.8383 11.1478 13.6139 10.5298 13.4095C8.95989 12.8901 8.17492 12.6304 8.0195 12.2192C7.60796 11.1304 13.8362 9.32902 14.7728 10.2571Z" />
    </svg>
  )
}

export function RouteIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="18" cy="5" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="19" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5H8.5C6.567 5 5 6.567 5 8.5C5 10.433 6.567 12 8.5 12H15.5C17.433 12 19 13.567 19 15.5C19 17.433 17.433 19 15.5 19H12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FlashIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M5.22576 11.3294L12.224 2.34651C12.7713 1.64397 13.7972 2.08124 13.7972 3.01707V9.96994C13.7972 10.5305 14.1995 10.985 14.6958 10.985H18.0996C18.8729 10.985 19.2851 12.0149 18.7742 12.6706L11.776 21.6535C11.2287 22.356 10.2028 21.9188 10.2028 20.9829V14.0301C10.2028 13.4695 9.80048 13.015 9.3042 13.015H5.90035C5.12711 13.015 4.71494 11.9851 5.22576 11.3294Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MountainIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M16 20H2L5.22457 10.7557C6.79555 6.25189 7.58104 4 9 4C10.3373 4 11.1119 6 12.5116 10" strokeLinejoin="round" />
      <path d="M6 20H22L17.4066 12.6585C15.8806 10.2195 15.1176 9 14 9C12.8824 9 12.1194 10.2195 10.5934 12.6585L9.12837 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ScalesIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="5" r="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 5H4M14 5H20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 21H7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7V21" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14L18.5 8H19.5L22 14C22 15.6569 20.6569 17 19 17C17.3431 17 16 15.6569 16 14ZM22 14H16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14L4.5 8H5.5L8 14C8 15.6569 6.65685 17 5 17C3.34315 17 2 15.6569 2 14ZM8 14H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
