export function TreeLogo({ variant = 'header' }: { variant?: 'header' | 'card' }) {
  return (
    <span className={`geodom-brand__icon geodom-brand__icon--${variant}`}>
      <img className={`ftree-logo ftree-logo--${variant}`} src="/logos/logo-medium.png" alt="FTree" />
    </span>
  )
}

export function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h5v5H5zm9 0h5v5h-5zM5 14h5v5H5zm9 0h5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12h16M12 4c2.4 2.5 3.4 5.2 3.4 8s-1 5.5-3.4 8M12 4C9.6 6.5 8.6 9.2 8.6 12s1 5.5 3.4 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.4a3.6 3.6 0 1 0-3.6-3.6 3.6 3.6 0 0 0 3.6 3.6Zm0 1.8c-3 0-5.7 1.55-5.7 3.5a.8.8 0 0 0 1.6 0c0-.94 1.86-2.1 4.1-2.1s4.1 1.16 4.1 2.1a.8.8 0 0 0 1.6 0c0-1.95-2.7-3.5-5.7-3.5Z" fill="currentColor" />
    </svg>
  )
}

export function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12h.01M12 12h.01M18 12h.01" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}

export function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5M9 12h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

export function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 4 1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7ZM18 4l.6 1.4L20 6l-1.4.6L18 8l-.6-1.4L16 6l1.4-.6ZM18 16l.6 1.4L20 18l-1.4.6L18 20l-.6-1.4L16 18l1.4-.6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

export function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 8v6M8 11h6m2 5 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11h6m2 5 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function FitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4H4v4M16 4h4v4M20 16v4h-4M8 20H4v-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8.8A3.2 3.2 0 1 0 15.2 12 3.2 3.2 0 0 0 12 8.8Zm8 3.2-1.75-.7a6.8 6.8 0 0 0-.6-1.45l.8-1.7-1.8-1.8-1.7.8a6.8 6.8 0 0 0-1.45-.6L12 4l-1.4 1.75a6.8 6.8 0 0 0-1.45.6l-1.7-.8-1.8 1.8.8 1.7a6.8 6.8 0 0 0-.6 1.45L4 12l1.75 1.4a6.8 6.8 0 0 0 .6 1.45l-.8 1.7 1.8 1.8 1.7-.8a6.8 6.8 0 0 0 1.45.6L12 20l1.4-1.75a6.8 6.8 0 0 0 1.45-.6l1.7.8 1.8-1.8-.8-1.7a6.8 6.8 0 0 0 .6-1.45Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  )
}

export function TuneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h7M15 7h5M9 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm-5 10h11M19 17h1M13 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 7.5 18.5 12 14 16.5M8 12h10.5M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

export function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11.5a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 9 11.5Zm6 0a2.5 2.5 0 1 0-2.5-2.5 2.5 2.5 0 0 0 2.5 2.5ZM9 13c-2.2 0-4 .96-4 2.4a.7.7 0 0 0 1.4 0c0-.52 1.15-1.1 2.6-1.1s2.6.58 2.6 1.1a.7.7 0 0 0 1.4 0C13 13.96 11.2 13 9 13Zm6 0c-.81 0-1.57.13-2.22.37a4 4 0 0 1 1.22 2.03c.32-.08.66-.13 1-.13 1.45 0 2.6.58 2.6 1.1a.7.7 0 0 0 1.4 0C19 13.96 17.2 13 15 13Z" fill="currentColor" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

export function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 14 7.8 16.2a3 3 0 0 1-4.2-4.2L6.8 8.8a3 3 0 0 1 4.2 0M14 10l2.2-2.2a3 3 0 1 1 4.2 4.2l-3.2 3.2a3 3 0 0 1-4.2 0M8.8 15.2l6.4-6.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}
