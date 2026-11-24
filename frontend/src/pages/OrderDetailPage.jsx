import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/authContext.js'
import { ApiError } from '../services/apiClient.js'
import { obtenerPedidoPorCodigo } from '../services/orderService.js'
import { formatOrderDate, formatProductPrice } from '../utils/formatters.js'
import '../components/orders/orderDetail.css'

const ORDER_CODE_REGEX = /^NV-\d{8}-[A-F0-9]{12}$/
const INVALID_ORDER_STATE = {
  status: 'not-found',
  message: 'No encontramos el pedido solicitado o no está disponible para esta cuenta.',
}
const LOADING_ORDER_STATE = { status: 'loading', data: null }

function createErrorState(error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return {
        status: 'not-found',
        message: 'No encontramos el pedido solicitado o no está disponible para esta cuenta.',
      }
    }

    if (error.status === 401) {
      return {
        status: 'error',
        title: 'Sesión no válida',
        message: 'Tu sesión ya no es válida o ha expirado.',
        canRetry: false,
      }
    }

    if (error.status === 403) {
      return {
        status: 'error',
        title: 'Pedido no disponible',
        message: 'Tu cuenta no tiene permisos para consultar este pedido.',
        canRetry: false,
      }
    }
  }

  return {
    status: 'error',
    title: 'No pudimos cargar el pedido.',
    message: 'Verifica tu conexión e intenta nuevamente.',
    canRetry: true,
  }
}

function BackToOrdersLink({ className = '' }) {
  return (
    <Link className={`order-detail__back-link ${className}`.trim()} to="/mi-cuenta#pedidos">
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="m12.5 5-5 5 5 5M8 10h7" />
      </svg>
      Volver a mis pedidos
    </Link>
  )
}

function OrderState({ state, onRetry }) {
  const isNotFound = state.status === 'not-found'
  const title = isNotFound ? 'Pedido no encontrado' : state.title

  return (
    <section className="order-detail-state" role="alert" aria-labelledby="order-state-title">
      <span className="order-detail-state__mark" aria-hidden="true">
        {isNotFound ? '?' : '!'}
      </span>
      <p className="section-eyebrow">Mi cuenta</p>
      <h1 id="order-state-title">{title}</h1>
      <p>{state.message}</p>
      <div className="order-detail-state__actions">
        {state.canRetry && <Button onClick={onRetry}>Reintentar</Button>}
        <BackToOrdersLink />
      </div>
    </section>
  )
}

function OrderDetailPage() {
  const { codigo } = useParams()
  const { token, user } = useAuth()
  const normalizedOrderCode = typeof codigo === 'string' ? codigo.trim().toUpperCase() : ''
  const isValidOrderCode = ORDER_CODE_REGEX.test(normalizedOrderCode)
  const [requestVersion, setRequestVersion] = useState(0)
  const requestKey = `${normalizedOrderCode}:${requestVersion}`
  const [orderState, setOrderState] = useState(LOADING_ORDER_STATE)

  useEffect(() => {
    if (!isValidOrderCode) return undefined

    const controller = new AbortController()
    let isCurrent = true

    obtenerPedidoPorCodigo(token, normalizedOrderCode, { signal: controller.signal })
      .then((order) => {
        if (!isCurrent || controller.signal.aborted) return
        setOrderState({ status: 'success', data: order, requestKey })
      })
      .catch((error) => {
        if (!isCurrent || controller.signal.aborted || error?.name === 'AbortError') return
        setOrderState({ ...createErrorState(error), requestKey })
      })

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [isValidOrderCode, normalizedOrderCode, requestKey, token])

  const handleRetry = () => {
    setRequestVersion((current) => current + 1)
  }

  const visibleOrderState = !isValidOrderCode
    ? INVALID_ORDER_STATE
    : orderState.requestKey === requestKey
      ? orderState
      : LOADING_ORDER_STATE

  const clientName = typeof user?.nombre === 'string' && user.nombre.trim()
    ? user.nombre.trim()
    : 'Cliente'

  return (
    <main className="order-detail-page">
      <div className="section-shell order-detail">
        <BackToOrdersLink className="order-detail__back-link--top" />

        {visibleOrderState.status === 'loading' && (
          <section
            className="order-detail-loading"
            aria-live="polite"
            aria-busy="true"
            aria-labelledby="order-loading-title"
          >
            <span className="order-detail-loading__indicator" aria-hidden="true" />
            <div>
              <p className="section-eyebrow">Mi cuenta</p>
              <h1 id="order-loading-title">Estamos cargando tu pedido.</h1>
              <p>Consultando la información histórica de tu compra.</p>
            </div>
          </section>
        )}

        {(visibleOrderState.status === 'error' || visibleOrderState.status === 'not-found') && (
          <OrderState state={visibleOrderState} onRetry={handleRetry} />
        )}

        {visibleOrderState.status === 'success' && (
          <OrderContent order={visibleOrderState.data} clientName={clientName} />
        )}
      </div>
    </main>
  )
}

function OrderContent({ order, clientName }) {
  const orderDate = formatOrderDate(order.createdAt)
  const distinctProducts = order.detalles.length
  const totalUnits = order.detalles.reduce(
    (total, detail) => total + detail.cantidad,
    0,
  )
  const observations = typeof order.observaciones === 'string'
    ? order.observaciones.trim()
    : ''

  return (
    <article className="order-detail__content" aria-labelledby="order-detail-title">
      <header className="order-detail-hero">
        <div className="order-detail-hero__identity">
          <p className="order-detail-hero__eyebrow">Pedido de {clientName}</p>
          <h1 id="order-detail-title">Pedido</h1>
          <p className="order-detail-hero__code">{order.codigoPedido}</p>
        </div>
        <span className="order-detail-hero__status">
          <span aria-hidden="true" />
          {order.estado}
        </span>
        <div className="order-detail-hero__date">
          <span>Fecha</span>
          {orderDate.dateTime ? (
            <time dateTime={orderDate.dateTime}>{orderDate.label}</time>
          ) : (
            <strong>{orderDate.label}</strong>
          )}
        </div>
      </header>

      <section className="order-detail-summary" aria-labelledby="order-summary-title">
        <div className="order-detail__section-heading">
          <p className="section-eyebrow">Compra registrada</p>
          <h2 id="order-summary-title">Resumen</h2>
        </div>
        <dl className="order-detail-summary__grid">
          <div>
            <dt>Productos</dt>
            <dd>{distinctProducts}</dd>
          </div>
          <div>
            <dt>Unidades</dt>
            <dd>{totalUnits}</dd>
          </div>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatProductPrice(order.subtotal)}</dd>
          </div>
          <div className="order-detail-summary__total">
            <dt>Total</dt>
            <dd>{formatProductPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="order-detail-products" aria-labelledby="order-products-title">
        <div className="order-detail__section-heading">
          <p className="section-eyebrow">Registro histórico</p>
          <h2 id="order-products-title">Productos del pedido</h2>
        </div>

        {order.detalles.length > 0 ? (
          <ul className="order-detail-products__list">
            {order.detalles.map((detail) => (
              <li key={detail.id}>
                <div className="order-detail-product__copy">
                  <h3>{detail.nombreProducto}</h3>
                  <p>{detail.cantidad} × {formatProductPrice(detail.precioUnitario)}</p>
                </div>
                <div className="order-detail-product__subtotal">
                  <span>Subtotal</span>
                  <strong>{formatProductPrice(detail.subtotal)}</strong>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="order-detail-products__empty">
            No hay detalles disponibles para este pedido.
          </p>
        )}
      </section>

      {observations && (
        <section className="order-detail-observations" aria-labelledby="order-observations-title">
          <p className="section-eyebrow">Información adicional</p>
          <h2 id="order-observations-title">Observaciones</h2>
          <p>{observations}</p>
        </section>
      )}

      <footer className="order-detail__footer">
        <BackToOrdersLink />
      </footer>
    </article>
  )
}

export default OrderDetailPage
