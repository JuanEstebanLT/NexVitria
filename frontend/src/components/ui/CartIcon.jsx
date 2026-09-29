function CartIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 4h2l1.6 9.1a2 2 0 0 0 2 1.65h7.8a2 2 0 0 0 1.93-1.48L20 7H6" />
      <path d="M9 20a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 9 20ZM17 20a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 17 20Z" />
    </svg>
  )
}

export default CartIcon
