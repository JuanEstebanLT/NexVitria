import { ApiError, apiRequest } from './apiClient.js'

export const ACCESS_TOKEN_KEY = 'nexvitria_access_token'

function requireAccessToken(payload) {
  const accessToken = payload?.data?.access_token

  if (!accessToken || typeof accessToken !== 'string') {
    throw new ApiError('No fue posible iniciar una sesión válida.', 500)
  }

  return {
    accessToken,
    expiresAt: payload.data.expires_at ?? null,
    expiresIn: payload.data.expires_in ?? null,
  }
}

export async function login(email, password) {
  const payload = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  return requireAccessToken(payload)
}

export async function register({ nombre, apellido, telefono, email, password }) {
  const payload = await apiRequest('/api/auth/registro', {
    method: 'POST',
    body: {
      nombre,
      apellido,
      telefono: typeof telefono === 'string' && telefono.trim() ? telefono.trim() : null,
      email,
      password,
    },
  })

  const accessToken = payload?.data?.access_token

  return {
    accessToken: typeof accessToken === 'string' && accessToken ? accessToken : null,
    expiresAt: payload?.data?.expires_at ?? null,
    expiresIn: payload?.data?.expires_in ?? null,
    requiresEmailConfirmation: payload?.data?.requires_email_confirmation === true,
    message: payload?.message,
  }
}

export async function getCurrentUser(token) {
  const payload = await apiRequest('/api/auth/me', { token })
  const profile = payload?.data

  if (!profile || typeof profile !== 'object') {
    throw new ApiError('No fue posible validar la sesión.', 500)
  }

  return profile
}

export async function updateCurrentUser(token, { nombre, apellido, telefono }) {
  const payload = await apiRequest('/api/auth/me', {
    method: 'PATCH',
    token,
    body: {
      nombre,
      apellido,
      telefono,
    },
  })
  const profile = payload?.data

  if (!profile || typeof profile !== 'object') {
    throw new ApiError('No fue posible actualizar los datos personales.', 500)
  }

  return profile
}

export async function logout(token) {
  return apiRequest('/api/auth/logout', {
    method: 'POST',
    token,
  })
}

export async function uploadAvatar(token, file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const payload = await apiRequest('/api/auth/avatar', {
    method: 'POST',
    token,
    body: formData,
  })

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new ApiError('No fue posible actualizar la foto de perfil.', 500)
  }

  return payload.data
}

export async function deleteAvatar(token) {
  const payload = await apiRequest('/api/auth/avatar', {
    method: 'DELETE',
    token,
  })

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new ApiError('No fue posible eliminar la foto de perfil.', 500)
  }

  return payload.data
}

export function getStoredAccessToken() {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeAccessToken(token) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearStoredAccessToken() {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // La memoria de React se limpia igualmente si el almacenamiento no está disponible.
  }
}
