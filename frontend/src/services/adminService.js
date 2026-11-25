import { ApiError, apiRequest } from './apiClient.js'
import { normalizeOrder } from './orderService.js'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROLES = new Set(['CLIENTE', 'EMPLEADO', 'ADMINISTRADOR'])

function requireObject(value, resourceName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(`La respuesta de ${resourceName} no tiene el formato esperado.`, 500)
  }

  return value
}

function requireUuid(value) {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    throw new ApiError('El identificador recibido desde administración no es válido.', 500)
  }

  return value.toLowerCase()
}

function normalizeOptionalText(value, fieldName) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw new ApiError(`El campo ${fieldName} recibido desde administración no es válido.`, 500)
  }

  return value.trim() || null
}

function normalizeUser(user) {
  const normalizedUser = requireObject(user, 'usuario administrativo')

  if (!ROLES.has(normalizedUser.rol)) {
    throw new ApiError('El rol recibido desde administración no es válido.', 500)
  }

  if (typeof normalizedUser.activo !== 'boolean') {
    throw new ApiError('El estado recibido desde administración no es válido.', 500)
  }

  if (typeof normalizedUser.created_at !== 'string' || !normalizedUser.created_at.trim()) {
    throw new ApiError('La fecha recibida desde administración no es válida.', 500)
  }

  return {
    id: requireUuid(normalizedUser.id),
    email: normalizeOptionalText(normalizedUser.email, 'email'),
    nombre: normalizeOptionalText(normalizedUser.nombre, 'nombre'),
    apellido: normalizeOptionalText(normalizedUser.apellido, 'apellido'),
    telefono: normalizeOptionalText(normalizedUser.telefono, 'telefono'),
    rol: normalizedUser.rol,
    activo: normalizedUser.activo,
    createdAt: normalizedUser.created_at,
  }
}

export async function obtenerUsuariosAdmin(token, { signal } = {}) {
  const payload = await apiRequest('/api/admin/usuarios', { token, signal })

  if (!Array.isArray(payload?.data)) {
    throw new ApiError('La respuesta de usuarios no tiene el formato esperado.', 500)
  }

  return payload.data.map(normalizeUser)
}

export async function obtenerUsuarioAdmin(token, userId, { signal } = {}) {
  const payload = await apiRequest(`/api/admin/usuarios/${encodeURIComponent(userId)}`, {
    token,
    signal,
  })

  return normalizeUser(requireObject(payload?.data, 'usuario administrativo'))
}

export async function obtenerPedidosUsuarioAdmin(token, userId, { signal } = {}) {
  const payload = await apiRequest(
    `/api/admin/usuarios/${encodeURIComponent(userId)}/pedidos`,
    { token, signal },
  )

  if (!Array.isArray(payload?.data)) {
    throw new ApiError('La respuesta de pedidos administrativos no tiene el formato esperado.', 500)
  }

  return payload.data.map(normalizeOrder)
}
