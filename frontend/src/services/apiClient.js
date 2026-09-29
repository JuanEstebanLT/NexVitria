import { API_BASE_URL } from '../config/api.js'

const STATUS_MESSAGES = {
  400: 'Revisa la información ingresada e intenta nuevamente.',
  401: 'La sesión no es válida o ha expirado.',
  403: 'No tienes permiso para realizar esta acción.',
  409: 'La información ya se encuentra registrada.',
  429: 'Demasiados intentos. Intenta nuevamente más tarde.',
  500: 'No fue posible completar la solicitud. Intenta nuevamente.',
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(
  path,
  { method = 'GET', token, body, headers = {}, signal } = {},
) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const requestUrl = `${API_BASE_URL}${normalizedPath}`
  const requestHeaders = { ...headers }
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (body !== undefined && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(requestUrl, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : (isFormData ? body : JSON.stringify(body)),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('No fue posible conectar con NexVitria. Verifica tu conexión e intenta nuevamente.')
  }

  const responseText = await response.text()
  let payload = null

  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message = response.status === 429
      ? STATUS_MESSAGES[429]
      : payload?.message || STATUS_MESSAGES[response.status] || STATUS_MESSAGES[500]

    throw new ApiError(message, response.status)
  }

  return payload
}
