import { useEffect, useState } from 'react'
import {
  clearStoredAccessToken,
  deleteAvatar as deleteAvatarRequest,
  getCurrentUser,
  getStoredAccessToken,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  storeAccessToken,
  updateCurrentUser,
  uploadAvatar as uploadAvatarRequest,
} from '../services/authService.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    const restoreSession = async () => {
      const storedToken = getStoredAccessToken()

      if (!storedToken) {
        if (isCurrent) setIsLoading(false)
        return
      }

      try {
        const profile = await getCurrentUser(storedToken)

        if (!profile?.id || profile.activo !== true) {
          throw new Error('No fue posible validar la sesión.')
        }

        if (isCurrent) {
          setToken(storedToken)
          setUser(profile)
        }
      } catch {
        clearStoredAccessToken()
        if (isCurrent) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    restoreSession()

    return () => {
      isCurrent = false
    }
  }, [])

  const establishSession = async (accessToken) => {
    storeAccessToken(accessToken)

    try {
      const profile = await getCurrentUser(accessToken)

      if (!profile?.id || profile.activo !== true) {
        throw new Error('No fue posible validar la sesión.')
      }

      setToken(accessToken)
      setUser(profile)
      return profile
    } catch (error) {
      clearStoredAccessToken()
      setToken(null)
      setUser(null)
      throw error
    }
  }

  const login = async (email, password) => {
    setIsLoading(true)

    try {
      const session = await loginRequest(email, password)
      const accessToken = session?.accessToken

      if (typeof accessToken !== 'string' || !accessToken.trim()) {
        throw new Error('No fue posible iniciar una sesión válida.')
      }

      return await establishSession(accessToken)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (account) => {
    const result = await registerRequest(account)

    if (!result.accessToken) {
      return { ...result, user: null }
    }

    const profile = await establishSession(result.accessToken)
    return { ...result, user: profile }
  }

  const logout = async () => {
    const activeToken = token || getStoredAccessToken()

    try {
      if (activeToken) {
        await logoutRequest(activeToken)
      }
    } finally {
      clearStoredAccessToken()
      setToken(null)
      setUser(null)
    }
  }

  const uploadAvatar = async (file) => {
    const activeToken = token || getStoredAccessToken()

    if (!activeToken) {
      throw new Error('La sesión no es válida o ha expirado.')
    }

    const avatar = await uploadAvatarRequest(activeToken, file)
    setUser((currentUser) => currentUser ? { ...currentUser, ...avatar } : currentUser)
    return avatar
  }

  const removeAvatar = async () => {
    const activeToken = token || getStoredAccessToken()

    if (!activeToken) {
      throw new Error('La sesión no es válida o ha expirado.')
    }

    const avatar = await deleteAvatarRequest(activeToken)
    setUser((currentUser) => currentUser ? { ...currentUser, ...avatar } : currentUser)
    return avatar
  }

  const updateProfile = async (personalData) => {
    const activeToken = token || getStoredAccessToken()

    if (!activeToken) {
      throw new Error('La sesión no es válida o ha expirado.')
    }

    const profile = await updateCurrentUser(activeToken, personalData)
    setUser(profile)
    return profile
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user?.id && user.activo === true),
    isLoading,
    login,
    register,
    logout,
    uploadAvatar,
    removeAvatar,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
