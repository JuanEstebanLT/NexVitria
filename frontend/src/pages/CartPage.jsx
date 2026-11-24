import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProductImage from '../components/products/ProductImage.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/authContext.js'
import { useCart } from '../context/cartContext.js'
import { useCatalog } from '../context/catalogContext.js'
import { ApiError } from '../services/apiClient.js'
import { crearPedido } from '../services/orderService.js'
import { formatProductPrice } from '../utils/formatters.js'
import '../components/cart/cart.css'

const MAX_OBSERVATIONS_LENGTH = 500

function getOrderErrorMessage(error) {
  if (!(error instanceof ApiError)) {
    return 'No fue posible confirmar el pedido. Intenta nuevamente.'
  }

  if (error.status === 401) {
    return 'Tu sesión ya no es válida o ha expirado. Inicia sesión nuevamente.'
  }

  if (error.status === 403) {
    return error.message || 'Tu cuenta no tiene permiso para confirmar pedidos.'
  }

  if (error.status === 400 || error.status === 409 || error.status === 0) {
    return error.message
  }

  return 'No fue posible confirmar el pedido. Conservamos tu carrito para que puedas intentarlo nuevamente.'
}

function isCreatedOrder(value) {
  return Boolean(
    value &&
    typeof value.id === 'string' &&
    typeof value.codigoPedido === 'string' &&
    typeof value.estado === 'string' &&
    Number.isFinite(value.total) &&
    Array.isArray(value.detalles),
  )
}

function OrderConfirmation({ order }) {
  const totalUnits = order.detalles.reduce(
    (total, detail) => total + detail.cantidad,
    0,
  )

  return (
    <main className="cart-page">
      <section
        className="order-confirmation section-shell"
        role="status"
        aria-live="polite"
        aria-labelledby="order-confirmation-title"
      >
        <span className="order-confirmation__icon" aria-hidden="true">✓</span>
        <p className="section-eyebrow">Solicitud registrada</p>
        <h1 id="order-confirmation-title">Pedido confirmado</h1>
        <p className="order-confirmation__intro">
          Tu pedido fue registrado correctamente y quedó pendiente de los siguientes pasos.
        </p>

        <dl className="order-confirmation__details">
          <div>
            <dt>Estado</dt>
            <dd>{order.estado}</dd>
          </div>
          <div>
            <dt>Total confirmado</dt>
            <dd>{formatProductPrice(order.total)}</dd>
          </div>
          <div>
            <dt>Unidades</dt>
            <dd>{totalUnits}</dd>
          </div>
          <div className="order-confirmation__reference">
            <dt>Referencia del pedido</dt>
            <dd>{order.codigoPedido}</dd>
          </div>
        </dl>

        <div className="order-confirmation__actions">
          <Link className="ui-button ui-button--accent" to="/mi-cuenta#pedidos">
            Ver mis pedidos
          </Link>
          <Link className="ui-button ui-button--secondary" to="/productos">
            Seguir explorando
          </Link>
        </div>
      </section>
    </main>
  )
}

function CartPage() {
  const { token } = useAuth()
  const { retryProducts } = useCatalog()
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    getProductQuantityLimit,
    isCartLoading,
    cartError,
    retryCart,
  } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const routeOrder = isCreatedOrder(location.state?.createdOrder)
    ? location.state.createdOrder
    : null
  const routeError = typeof location.state?.orderError === 'string'
    ? location.state.orderError
    : ''
  const [observations, setObservations] = useState('')
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(routeOrder)
  const [orderError, setOrderError] = useState(routeError)
  const submissionInFlight = useRef(false)

  const replaceCartState = (state) => {
    navigate('/carrito', { replace: true, state })
  }

  const handleCreateOrder = async () => {
    if (submissionInFlight.current || isSubmittingOrder) return

    setOrderError('')
    replaceCartState(null)

    if (!token) {
      setOrderError('Tu sesión ya no es válida o ha expirado. Inicia sesión nuevamente.')
      return
    }

    submissionInFlight.current = true
    setIsSubmittingOrder(true)

    try {
      const order = await crearPedido(token, {
        items: items.map(({ product, quantity }) => ({
          producto_id: product.id,
          cantidad: quantity,
        })),
        observaciones: observations.trim() || null,
      })

      setCreatedOrder(order)
      replaceCartState({ createdOrder: order })
      clearCart()
      retryProducts()
    } catch (error) {
      const message = getOrderErrorMessage(error)

      setOrderError(message)
      replaceCartState({ orderError: message })

      if (error instanceof ApiError && error.status === 409) {
        retryProducts()
      }
    } finally {
      submissionInFlight.current = false
      setIsSubmittingOrder(false)
    }
  }

  if (createdOrder) {
    return <OrderConfirmation order={createdOrder} />
  }

  if (isCartLoading) {
    return (
      <main className="cart-page">
        <section className="cart-empty section-shell" aria-live="polite">
          <span className="cart-empty__icon" aria-hidden="true">…</span>
          <p className="section-eyebrow">Mi carrito</p>
          <h1>Estamos actualizando tu carrito.</h1>
          <p>Validando productos, disponibilidad y stock.</p>
        </section>
      </main>
    )
  }

  if (cartError) {
    return (
      <main className="cart-page">
        <section className="cart-empty section-shell" role="alert">
          <span className="cart-empty__icon" aria-hidden="true">!</span>
          <p className="section-eyebrow">Mi carrito</p>
          <h1>No pudimos cargar tu carrito.</h1>
          <p>Necesitamos consultar el catálogo actual para validar tus productos.</p>
          <button className="ui-button ui-button--accent" type="button" onClick={retryCart}>
            Reintentar
          </button>
        </section>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <section className="cart-empty section-shell" aria-labelledby="empty-cart-title">
          <span className="cart-empty__icon" aria-hidden="true">0</span>
          <p className="section-eyebrow">Mi carrito</p>
          <h1 id="empty-cart-title">Tu carrito está vacío.</h1>
          <p>Explora el catálogo y agrega los productos que quieras consultar.</p>
          <Link className="ui-button ui-button--accent" to="/productos">Explorar productos</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <div className="section-shell">
        <header className="cart-page__header">
          <p className="section-eyebrow">Selección personal</p>
          <h1>Mi carrito</h1>
          <p>{totalItems} {totalItems === 1 ? 'unidad' : 'unidades'} en tu selección.</p>
        </header>

        <div className="cart-layout">
          <section className="cart-items" aria-label="Productos del carrito">
            {items.map(({ product, quantity }) => {
              const quantityLimit = getProductQuantityLimit(product)

              return (
                <article className="cart-item" key={product.id}>
                  <div className="cart-item__media">
                    <ProductImage
                      src={product.imageUrl}
                      alt={`Presentación de ${product.name}`}
                    />
                  </div>
                  <div className="cart-item__content">
                    <p className="cart-item__category">
                      {product.category?.name ?? 'Sin categoría'}
                    </p>
                    <h2>{product.name}</h2>
                    <p className="cart-item__unit-price">
                      Precio unitario: {formatProductPrice(product.price)}
                    </p>
                    <div className="cart-item__controls">
                      <div className="quantity-selector" role="group" aria-label={`Cantidad de ${product.name}`}>
                        <div className="quantity-selector__controls">
                          <button type="button" aria-label={`Disminuir cantidad de ${product.name}`} disabled={isSubmittingOrder || quantity === 1} onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                          <output aria-live="polite" aria-label={`Cantidad: ${quantity}`}>{quantity}</output>
                          <button type="button" aria-label={`Aumentar cantidad de ${product.name}`} disabled={isSubmittingOrder || quantity >= quantityLimit} onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                        </div>
                      </div>
                      <button className="cart-item__remove" type="button" disabled={isSubmittingOrder} onClick={() => removeItem(product.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="cart-item__subtotal">
                    <span>Subtotal</span>
                    <strong>{formatProductPrice(product.price * quantity)}</strong>
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Resumen</h2>
            <dl>
              <div><dt>Unidades</dt><dd>{totalItems}</dd></div>
              <div className="cart-summary__total"><dt>Subtotal de referencia</dt><dd>{formatProductPrice(subtotal)}</dd></div>
            </dl>

            <div className="cart-summary__observations">
              <label htmlFor="order-observations">Observaciones del pedido</label>
              <textarea
                id="order-observations"
                value={observations}
                maxLength={MAX_OBSERVATIONS_LENGTH}
                rows="4"
                placeholder="Entrega, indicaciones u otra información opcional…"
                disabled={isSubmittingOrder}
                onChange={(event) => setObservations(event.target.value)}
              />
              <span className="cart-summary__counter">
                {observations.length} / {MAX_OBSERVATIONS_LENGTH}
              </span>
            </div>

            <p>
              El precio y la disponibilidad se validarán nuevamente al confirmar el pedido.
            </p>
            <Button
              className="cart-summary__submit"
              variant="accent"
              disabled={isSubmittingOrder}
              aria-busy={isSubmittingOrder}
              onClick={handleCreateOrder}
            >
              {isSubmittingOrder ? 'Confirmando pedido…' : 'Confirmar pedido'}
            </Button>
            {orderError && (
              <p className="cart-summary__error" role="alert">
                {orderError}
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CartPage
