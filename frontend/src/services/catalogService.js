import { ApiError, apiRequest } from './apiClient.js'

function requireArray(payload, resourceName) {
  if (!Array.isArray(payload?.data)) {
    throw new ApiError(`La respuesta de ${resourceName} no tiene el formato esperado.`, 500)
  }

  return payload.data
}

function requireObject(payload, resourceName) {
  if (!payload?.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    throw new ApiError(`La respuesta de ${resourceName} no tiene el formato esperado.`, 500)
  }

  return payload.data
}

function requireFiniteNumber(value, fieldName) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    throw new ApiError(`El campo ${fieldName} recibido desde el catálogo no es válido.`, 500)
  }

  return numericValue
}

export function normalizeCategory(category) {
  if (!category || typeof category !== 'object') return null

  return {
    id: category.id,
    name: category.nombre,
    description: category.descripcion ?? null,
    active: category.activo === true,
  }
}

export function normalizeProduct(product) {
  if (!product || typeof product !== 'object') {
    throw new ApiError('La API devolvió un producto inválido.', 500)
  }

  const price = requireFiniteNumber(product.precio, 'precio')
  const stock = requireFiniteNumber(product.stock, 'stock')

  return {
    id: product.id,
    name: product.nombre,
    description: product.descripcion ?? '',
    price,
    stock: Math.max(0, Math.trunc(stock)),
    available: product.disponible === true,
    active: product.activo === true,
    imageUrl:
      typeof product.imagen_url === 'string' && product.imagen_url.trim()
        ? product.imagen_url.trim()
        : null,
    categoryId: product.categoria_id ?? product.categoria?.id ?? null,
    category: normalizeCategory(product.categoria),
  }
}

export async function obtenerCategorias({ signal } = {}) {
  const payload = await apiRequest('/api/categorias', { signal })
  return requireArray(payload, 'categorías').map(normalizeCategory)
}

export async function obtenerProductos({ signal } = {}) {
  const payload = await apiRequest('/api/productos', { signal })
  return requireArray(payload, 'productos').map(normalizeProduct)
}

export async function obtenerProductoPorId(id, { signal } = {}) {
  const payload = await apiRequest(`/api/productos/${encodeURIComponent(id)}`, { signal })
  return normalizeProduct(requireObject(payload, 'producto'))
}
