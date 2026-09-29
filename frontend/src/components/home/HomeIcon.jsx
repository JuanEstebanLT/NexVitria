const ICONS = {
  visibility: (
    <>
      <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </>
  ),
  connection: (
    <>
      <circle cx="5" cy="6" r="2" />
      <circle cx="18.5" cy="5" r="2" />
      <circle cx="12" cy="18.5" r="2" />
      <path d="m6.8 6.1 9.7-.8M6.2 7.7l4.6 8.9m6.3-9.8-4 9.8" />
    </>
  ),
  organization: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  growth: (
    <>
      <path d="M4 19V5m0 14h16" />
      <path d="m7 15 4-4 3 2 5-6" />
      <path d="M15.5 7H19v3.5" />
    </>
  ),
  wellness: (
    <>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      <path d="M12 17c-.2-4 1.4-6.7 4.5-8" />
    </>
  ),
  hair: (
    <>
      <path d="M12 3s5 5.8 5 10a5 5 0 0 1-10 0c0-4.2 5-10 5-10Z" />
      <path d="M9 13c1.4-1.5 4.6-1.5 6 0M9.5 16c1.2-1 3.8-1 5 0" />
    </>
  ),
  body: (
    <>
      <circle cx="12" cy="5" r="2.25" />
      <path d="M8 21v-5l-2-4a3 3 0 0 1 2.7-4.3h6.6A3 3 0 0 1 18 12l-2 4v5" />
      <path d="M9 12h6" />
    </>
  ),
  hygiene: (
    <>
      <rect x="4" y="10" width="16" height="9" rx="4.5" />
      <circle cx="8" cy="6" r="1.5" />
      <circle cx="13" cy="4" r="1" />
      <circle cx="17" cy="7" r="1.25" />
      <path d="M8 14h8" />
    </>
  ),
  products: (
    <>
      <path d="M4 8h16l-1 12H5L4 8Z" />
      <path d="M8 9V6a4 4 0 0 1 8 0v3" />
      <path d="M9 13h6" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2" />
      <circle cx="18" cy="9" r="2" />
      <path d="M16.5 14.5A4 4 0 0 1 21 18.4V20" />
    </>
  ),
  commerce: (
    <>
      <path d="M3 9h18l-2-5H5L3 9Z" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6M3 9c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
}

function HomeIcon({ name }) {
  return (
    <svg
      className="home-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
}

export default HomeIcon
