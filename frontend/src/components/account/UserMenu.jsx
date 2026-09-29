import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext.js'
import {
  PRESENCE_LABELS,
  PRESENCE_OPTIONS,
  usePresence,
} from '../../context/presenceContext.js'
import UserAvatar from './UserAvatar.jsx'
import './account.css'

function StatusDot({ status }) {
  return <span className={`presence-dot presence-dot--${status.toLowerCase()}`} aria-hidden="true" />
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      className={`user-menu__chevron${expanded ? ' user-menu__chevron--expanded' : ''}`}
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="m7 5 5 5-5 5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="user-menu__check" viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4 10 4 4 8-8" />
    </svg>
  )
}

function UserMenu({ className = '', onNavigate, onOpen }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPresenceOpen, setIsPresenceOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef(null)
  const menuId = useId()
  const presenceId = useId()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { status, statusLabel, selectStatus } = usePresence()
  const displayName = typeof user?.nombre === 'string' ? user.nombre.trim() : ''
  const email = typeof user?.email === 'string' ? user.email : ''
  const isClient = user?.rol === 'CLIENTE'

  const closeMenu = () => {
    setIsOpen(false)
    setIsPresenceOpen(false)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(closeMenu)
    return () => window.cancelAnimationFrame(frame)
  }, [location.key])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) closeMenu()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
        menuRef.current?.querySelector('.user-avatar--button')?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen) onOpen?.()
    setIsOpen((current) => !current)
    setIsPresenceOpen(false)
  }

  const handleNavigation = () => {
    closeMenu()
    onNavigate?.()
  }

  const handleStatusSelection = (nextStatus) => {
    selectStatus(nextStatus)
    setIsPresenceOpen(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
    } catch {
      // AuthContext limpia la sesión local aunque falle la revocación remota.
    } finally {
      closeMenu()
      onNavigate?.()
      setIsLoggingOut(false)
      navigate('/', { replace: true })
    }
  }

  return (
    <div className={['user-menu', className].filter(Boolean).join(' ')} ref={menuRef}>
      <UserAvatar
        interactive
        imageUrl={user?.avatar_url}
        status={status}
        statusLabel={statusLabel}
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Menú de usuario. Estado: ${statusLabel}`}
        onClick={handleToggle}
      />

      {isOpen && (
        <div className="user-menu__panel" id={menuId} role="menu">
          <div className="user-menu__identity">
            <UserAvatar
              className="user-menu__identity-avatar"
              imageUrl={user?.avatar_url}
              status={status}
              statusLabel={statusLabel}
              label={displayName ? `Avatar de ${displayName}` : 'Avatar de usuario'}
            />
            <div className="user-menu__identity-copy">
              <p className="user-menu__greeting">{displayName ? `Hola, ${displayName}` : 'Hola'}</p>
              {email && <p className="user-menu__email" title={email}>{email}</p>}
            </div>
          </div>

          <button
            className="user-menu__status-trigger"
            type="button"
            aria-controls={presenceId}
            aria-expanded={isPresenceOpen}
            onClick={() => setIsPresenceOpen((current) => !current)}
            role="menuitem"
          >
            <StatusDot status={status} />
            <span>{statusLabel}</span>
            <ChevronIcon expanded={isPresenceOpen} />
          </button>

          {isPresenceOpen && (
            <div className="user-menu__presence-options" id={presenceId} role="group" aria-label="Seleccionar presencia">
              {PRESENCE_OPTIONS.map((option) => {
                const isSelected = option === status

                return (
                  <button
                    className={`user-menu__presence-option${isSelected ? ' user-menu__presence-option--selected' : ''}`}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    key={option}
                    onClick={() => handleStatusSelection(option)}
                  >
                    <StatusDot status={option} />
                    <span>{PRESENCE_LABELS[option]}</span>
                    {isSelected && <CheckIcon />}
                  </button>
                )
              })}
            </div>
          )}

          <div className="user-menu__separator" role="separator" />

          <Link className="user-menu__link" to="/mi-cuenta" role="menuitem" onClick={handleNavigation}>
            Mi perfil
          </Link>
          {isClient && (
            <Link className="user-menu__link" to="/mi-cuenta#pedidos" role="menuitem" onClick={handleNavigation}>
              Mis pedidos
            </Link>
          )}

          <div className="user-menu__separator" role="separator" />

          <button
            className="user-menu__logout"
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={handleLogout}
          >
            {isLoggingOut ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
