import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './authContext.js'
import {
  PRESENCE_LABELS,
  PRESENCE_STATUS,
  PresenceContext,
} from './presenceContext.js'

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000
const ACTIVITY_THROTTLE_MS = 1000
const STORAGE_KEY_PREFIX = 'nexvitria_presence_'
const MANUAL_STATUSES = new Set(Object.values(PRESENCE_STATUS))
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'click', 'scroll', 'touchstart']

function getStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${userId}`
}

function readStoredPreference(userId) {
  if (!userId) return { status: PRESENCE_STATUS.ONLINE, manual: false }

  try {
    const storedPreference = JSON.parse(localStorage.getItem(getStorageKey(userId)) || 'null')

    if (storedPreference?.manual === true && MANUAL_STATUSES.has(storedPreference.status)) {
      return { status: storedPreference.status, manual: true }
    }
  } catch {
    // Una preferencia inválida no impide iniciar la presencia local en línea.
  }

  return { status: PRESENCE_STATUS.ONLINE, manual: false }
}

function PresenceSessionProvider({ children, userId }) {
  const [preference, setPreference] = useState(() => readStoredPreference(userId))
  const [isAutomaticallyAway, setIsAutomaticallyAway] = useState(false)
  const [isNetworkOnline, setIsNetworkOnline] = useState(() => (
    typeof navigator === 'undefined' ? true : navigator.onLine
  ))

  useEffect(() => {
    if (!userId) return undefined

    const handleOnline = () => setIsNetworkOnline(true)
    const handleOffline = () => setIsNetworkOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [userId])

  useEffect(() => {
    if (!userId || !isNetworkOnline) return undefined

    let inactivityTimer
    let lastHandledActivity = 0

    const scheduleAutomaticAway = () => {
      window.clearTimeout(inactivityTimer)

      if (preference.status === PRESENCE_STATUS.ONLINE && !isAutomaticallyAway) {
        inactivityTimer = window.setTimeout(() => {
          setIsAutomaticallyAway(true)
        }, INACTIVITY_TIMEOUT_MS)
      }
    }

    const handleActivity = () => {
      const now = Date.now()

      if (!isAutomaticallyAway && now - lastHandledActivity < ACTIVITY_THROTTLE_MS) return
      lastHandledActivity = now

      if (preference.status !== PRESENCE_STATUS.ONLINE) return

      if (isAutomaticallyAway) {
        setIsAutomaticallyAway(false)
        return
      }

      scheduleAutomaticAway()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleActivity()
    }

    scheduleAutomaticAway()
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearTimeout(inactivityTimer)
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAutomaticallyAway, isNetworkOnline, preference.status, userId])

  const selectStatus = useCallback((status) => {
    if (!userId || !MANUAL_STATUSES.has(status)) return

    const nextPreference = { status, manual: true }
    setPreference(nextPreference)
    setIsAutomaticallyAway(false)

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(nextPreference))
    } catch {
      // La selección sigue operativa en memoria si localStorage no está disponible.
    }
  }, [userId])

  const status = !isNetworkOnline
    ? PRESENCE_STATUS.OFFLINE
    : isAutomaticallyAway
      ? PRESENCE_STATUS.AWAY
      : preference.status

  const value = useMemo(() => ({
    status,
    statusLabel: PRESENCE_LABELS[status],
    preferredStatus: preference.status,
    isManual: preference.manual,
    isAutomaticallyAway,
    isNetworkOnline,
    selectStatus,
  }), [isAutomaticallyAway, isNetworkOnline, preference, selectStatus, status])

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

export function PresenceProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const userId = isAuthenticated && user?.id ? String(user.id) : null

  return (
    <PresenceSessionProvider key={userId || 'no-user'} userId={userId}>
      {children}
    </PresenceSessionProvider>
  )
}
