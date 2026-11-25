import { ApiError, apiRequest } from './apiClient.js'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ORDER_CODE_REGEX = /^NV-\d{8}-[A-F0-9]{12}$/

function requireObject(value, resourceName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(`La respuesta de ${resourceName} no tiene el formato esperado.`, 500)
  }

  return value
}

function requireUuid(value, fieldName) {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    throw new ApiError(`El campo ${fieldName} recibido desde pedidos no es válido.`, 500)
  }

  return value.toLowerCase()
}

function requireOrderCode(value) {
  const normalizedValue = typeof value === 'string' ? value.trim().toUpperCase() : ''

  if (!ORDER_CODE_REGEX.test(normalizedValue)) {
    throw new ApiError('El código recibido desde pedidos no es válido.', 500)
  }

  return normalizedValue
}

function requireText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(`El campo ${fieldName} recibido desde pedidos no es válido.`, 500)
  }

  return value.trim()
}

function requireFiniteNumber(value, fieldName) {
  const hasNumericType =
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '')

  if (!hasNumericType) {
    throw new ApiError(`El campo ${fieldName} recibido desde pedidos no es válido.`, 500)
  }

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    throw new ApiError(`El campo ${fieldName} recibido desde pedidos no es válido.`, 500)
  }

  return numericValue
}

function requireQuantity(value) {
  const hasNumericType =
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '')

  if (!hasNumericType) {
    throw new ApiError('La cantidad recibida desde pedidos no es válida.', 500)
  }

  const quantity = Number(value)

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new ApiError('La cantidad recibida desde pedidos no es válida.', 500)
  }

  return quantity
}

function normalizeOptionalText(value, fieldName) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw new ApiError(`El campo ${fieldName} recibido desde pedidos no es válido.`, 500)
  }

  return value
}

function normalizeOptionalTimestamp(value, fieldName) {
  if (value === undefined || value === null) return null
  return requireText(value, fieldName)
}

function normalizeOrderDetail(detail) {
  const normalizedDetail = requireObject(detail, 'detalle de pedido')

  return {
    id: requireUuid(normalizedDetail.id, 'id del detalle'),
    productoId: requireUuid(normalizedDetail.producto_id, 'producto_id'),
    nombreProducto: requireText(normalizedDetail.nombre_producto, 'nombre_producto'),
    precioUnitario: requireFiniteNumber(normalizedDetail.precio_unitario, 'precio_unitario'),
    cantidad: requireQuantity(normalizedDetail.cantidad),
    subtotal: requireFiniteNumber(normalizedDetail.subtotal, 'subtotal del detalle'),
    createdAt: normalizeOptionalTimestamp(normalizedDetail.created_at, 'created_at del detalle'),
  }
}

export function normalizeOrder(order) {
  const normalizedOrder = requireObject(order, 'pedido')

  if (!Array.isArray(normalizedOrder.detalles)) {
    throw new ApiError('Los detalles recibidos desde pedidos no tienen el formato esperado.', 500)
  }

  return {
    id: requireUuid(normalizedOrder.id, 'id del pedido'),
    codigoPedido: requireOrderCode(normalizedOrder.codigo_pedido),
    clienteId: requireUuid(normalizedOrder.cliente_id, 'cliente_id'),
    estado: requireText(normalizedOrder.estado, 'estado'),
    subtotal: requireFiniteNumber(normalizedOrder.subtotal, 'subtotal'),
    total: requireFiniteNumber(normalizedOrder.total, 'total'),
    observaciones: normalizeOptionalText(normalizedOrder.observaciones, 'observaciones'),
    createdAt: requireText(normalizedOrder.created_at, 'created_at'),
    updatedAt: normalizeOptionalTimestamp(normalizedOrder.updated_at, 'updated_at'),
    detalles: normalizedOrder.detalles.map(normalizeOrderDetail),
  }
}

function requireOrderPayload(payload) {
  return normalizeOrder(requireObject(payload?.data, 'pedido'))
}

export async function crearPedido(token, { items, observaciones }) {
  const payload = await apiRequest('/api/pedidos', {
    method: 'POST',
    token,
    body: {
      items,
      observaciones,
    },
  })

  return requireOrderPayload(payload)
}

export async function obtenerPedidos(token, { signal } = {}) {
  const payload = await apiRequest('/api/pedidos', { token, signal })

  if (!Array.isArray(payload?.data)) {
    throw new ApiError('La respuesta de pedidos no tiene el formato esperado.', 500)
  }

  return payload.data.map(normalizeOrder)
}

export async function obtenerPedidoPorCodigo(token, codigoPedido, { signal } = {}) {
  const payload = await apiRequest(`/api/pedidos/${encodeURIComponent(codigoPedido)}`, {
    token,
    signal,
  })

  return requireOrderPayload(payload)
}
