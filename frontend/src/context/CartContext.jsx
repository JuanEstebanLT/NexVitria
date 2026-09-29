import { useEffect, useState } from 'react'
import { useAuth } from './authContext.js'
import { useCatalog } from './catalogContext.js'
import { CartContext } from './cartContext.js'

const MAX_PRODUCT_QUANTITY = 10
const CART_KEY_PREFIX = 'nexvitria_cart_'
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const getCartKey = (userId) => `${CART_KEY_PREFIX}${userId}`

const isPurchasable = (product) =>
  product?.active === true && product?.available === true && product.stock > 0

const getProductQuantityLimit = (product) =>
  isPurchasable(product)
    ? Math.min(MAX_PRODUCT_QUANTITY, Math.max(0, Math.trunc(product.stock)))
    : 0

function normalizeQuantity(quantity, maximum) {
  const numericQuantity = Number(quantity)

  if (maximum <= 0) return 0
  if (!Number.isFinite(numericQuantity)) return 1
  return Math.min(maximum, Math.max(1, Math.trunc(numericQuantity)))
}

function readCart(userId, catalogProducts) {
  try {
    const storedItems = JSON.parse(localStorage.getItem(getCartKey(userId)) || '[]')

    if (!Array.isArray(storedItems)) return []

    return storedItems.reduce((normalizedItems, storedItem) => {
      if (!UUID_REGEX.test(storedItem?.productId)) return normalizedItems

      const product = catalogProducts.find(
        (candidate) => candidate.id === storedItem.productId,
      )
      const maximum = getProductQuantityLimit(product)

      if (!product || maximum === 0) return normalizedItems

      const quantity = normalizeQuantity(storedItem.quantity, maximum)
      const existingItem = normalizedItems.find((item) => item.product.id === product.id)

      if (existingItem) {
        existingItem.quantity = Math.min(
          maximum,
          existingItem.quantity + quantity,
        )
        return normalizedItems
      }

      normalizedItems.push({ product, quantity })
      return normalizedItems
    }, [])
  } catch {
    return []
  }
}

function persistCart(userId, items) {
  const storedItems = items
    .filter(({ product }) => UUID_REGEX.test(product.id))
    .map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
    }))

  try {
    localStorage.setItem(getCartKey(userId), JSON.stringify(storedItems))
  } catch {
    // El carrito sigue operativo en memoria si el almacenamiento no está disponible.
  }
}

function CartStateProvider({
  children,
  clientId,
  catalogProducts,
  catalogReady,
  catalogStatus,
  catalogError,
  retryCatalog,
}) {
  const [items, setItems] = useState(() =>
    clientId && catalogReady ? readCart(clientId, catalogProducts) : [],
  )

  useEffect(() => {
    if (clientId && catalogReady) {
      persistCart(clientId, items)
    }
  }, [catalogReady, clientId, items])

  const visibleItems = clientId ? items : []

  const addItem = (product, quantity = 1) => {
    const maximum = getProductQuantityLimit(product)

    if (!clientId || !catalogReady || !UUID_REGEX.test(product?.id) || maximum === 0) {
      return false
    }

    const quantityToAdd = normalizeQuantity(quantity, maximum)

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.id === product.id)

      if (!existingItem) {
        return [...currentItems, { product, quantity: quantityToAdd }]
      }

      return currentItems.map((item) => item.product.id === product.id
        ? {
            ...item,
            product,
            quantity: Math.min(maximum, item.quantity + quantityToAdd),
          }
        : item)
    })
    return true
  }

  const removeItem = (productId) => {
    if (!clientId) return
    setItems((currentItems) => currentItems.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (!clientId) return

    setItems((currentItems) => currentItems.flatMap((item) => {
      if (item.product.id !== productId) return [item]

      const maximum = getProductQuantityLimit(item.product)
      const nextQuantity = normalizeQuantity(quantity, maximum)
      return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : []
    }))
  }

  const clearCart = () => {
    if (!clientId) return
    setItems([])
  }

  const getTotalItems = () => visibleItems.reduce((total, item) => total + item.quantity, 0)
  const getSubtotal = () => visibleItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )

  const value = {
    items: visibleItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getSubtotal,
    getProductQuantityLimit,
    totalItems: getTotalItems(),
    subtotal: getSubtotal(),
    isCartAvailable: Boolean(clientId),
    isCartLoading: Boolean(clientId) && catalogStatus === 'loading',
    cartError: clientId && catalogStatus === 'error' ? catalogError : null,
    retryCart: retryCatalog,
    maxProductQuantity: MAX_PRODUCT_QUANTITY,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const {
    products,
    productsStatus,
    productsError,
    retryProducts,
  } = useCatalog()
  const clientId = isAuthenticated && user?.activo === true && user?.rol === 'CLIENTE'
    ? user.id
    : null
  const catalogReady = productsStatus === 'success'
  const providerKey = `${clientId || 'no-client'}:${catalogReady ? 'ready' : 'pending'}`

  return (
    <CartStateProvider
      key={providerKey}
      clientId={clientId}
      catalogProducts={products}
      catalogReady={catalogReady}
      catalogStatus={productsStatus}
      catalogError={productsError}
      retryCatalog={retryProducts}
    >
      {children}
    </CartStateProvider>
  )
}
