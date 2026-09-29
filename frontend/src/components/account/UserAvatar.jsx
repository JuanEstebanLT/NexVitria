import { useState } from 'react'

function AvatarImage({ imageUrl }) {
  const [hasError, setHasError] = useState(false)

  if (!imageUrl || hasError) return null

  return (
    <img
      className="user-avatar__image"
      src={imageUrl}
      alt=""
      onError={() => setHasError(true)}
    />
  )
}

function AvatarFallback() {
  return (
    <span className="user-avatar__fallback" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="8" r="4" />
        <path d="M4.75 20c.55-4 3.1-6 7.25-6s6.7 2 7.25 6" />
      </svg>
    </span>
  )
}

function AvatarContent({ imageUrl, status }) {
  return (
    <>
      {imageUrl ? <AvatarImage key={imageUrl} imageUrl={imageUrl} /> : null}
      <AvatarFallback />
      <span
        className={`presence-indicator presence-indicator--${status.toLowerCase()}`}
        aria-hidden="true"
      />
    </>
  )
}

function UserAvatar({
  className = '',
  imageUrl,
  interactive = false,
  size = 'header',
  status,
  statusLabel,
  label = 'Avatar de usuario',
  ...buttonProps
}) {
  const classes = [
    'user-avatar',
    `user-avatar--${size}`,
    interactive ? 'user-avatar--button' : '',
    className,
  ].filter(Boolean).join(' ')

  if (interactive) {
    return (
      <button className={classes} type="button" {...buttonProps}>
        <AvatarContent imageUrl={imageUrl} status={status} />
      </button>
    )
  }

  return (
    <div className={classes} role="img" aria-label={`${label}. Estado: ${statusLabel}`}>
      <AvatarContent imageUrl={imageUrl} status={status} />
    </div>
  )
}

export default UserAvatar
