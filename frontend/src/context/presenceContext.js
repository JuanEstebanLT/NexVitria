import { createContext, useContext } from 'react'

export const PRESENCE_STATUS = Object.freeze({
  ONLINE: 'ONLINE',
  AWAY: 'AWAY',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
})

export const PRESENCE_LABELS = Object.freeze({
  [PRESENCE_STATUS.ONLINE]: 'En línea',
  [PRESENCE_STATUS.AWAY]: 'Ausente',
  [PRESENCE_STATUS.BUSY]: 'Ocupado',
  [PRESENCE_STATUS.OFFLINE]: 'Aparecer desconectado',
})

export const PRESENCE_OPTIONS = Object.freeze([
  PRESENCE_STATUS.ONLINE,
  PRESENCE_STATUS.BUSY,
  PRESENCE_STATUS.AWAY,
  PRESENCE_STATUS.OFFLINE,
])

export const PresenceContext = createContext(null)

export function usePresence() {
  const context = useContext(PresenceContext)

  if (!context) {
    throw new Error('usePresence debe utilizarse dentro de PresenceProvider')
  }

  return context
}
