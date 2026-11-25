import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/authContext.js'
import {
  obtenerPedidosUsuarioAdmin,
  obtenerUsuarioAdmin,
  obtenerUsuariosAdmin,
} from '../services/adminService.js'
import { formatOrderDate, formatProductPrice } from '../utils/formatters.js'
import '../components/admin/admin.css'

const ROLE_LABELS = {
  CLIENTE: 'Cliente',
  EMPLEADO: 'Empleado',
  ADMINISTRADOR: 'Administrador',
}

const INITIAL_DETAIL_STATE = {
  data: null,
  status: 'idle',
  error: null,
}

const INITIAL_ORDERS_STATE = {
  data: [],
  status: 'idle',
  error: null,
}

function getDisplayName(user) {
  const fullName = [user?.nombre, user?.apellido]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || 'Sin nombre registrado'
}

function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getErrorMessage(error, fallback) {
  return typeof error?.message === 'string' && error.message.trim()
    ? error.message
    : fallback
}

function DateValue({ value }) {
  const formattedDate = formatOrderDate(value)

  return formattedDate.dateTime ? (
    <time dateTime={formattedDate.dateTime}>{formattedDate.label}</time>
  ) : (
    <span>{formattedDate.label}</span>
  )
}

function AccountStatus({ active }) {
  return (
    <span className={`admin-status admin-status--${active ? 'active' : 'inactive'}`}>
      <span aria-hidden="true" />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function StateMessage({ mark, title, message, onRetry }) {
  return (
    <div className="admin-state" role={onRetry ? 'alert' : 'status'}>
      <span className="admin-state__mark" aria-hidden="true">{mark}</span>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
        {onRetry && (
          <Button className="admin-state__retry" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}

function UserCard({ user, selected, onSelect }) {
  return (
    <article className={`admin-user-card${selected ? ' admin-user-card--selected' : ''}`}>
      <div className="admin-user-card__heading">
        <div>
          <h3>{getDisplayName(user)}</h3>
          <p title={user.email || undefined}>{user.email || 'Correo no disponible'}</p>
        </div>
        <AccountStatus active={user.activo} />
      </div>
      <dl className="admin-user-card__meta">
        <div>
          <dt>Rol</dt>
          <dd>{ROLE_LABELS[user.rol]}</dd>
        </div>
        <div>
          <dt>Registro</dt>
          <dd><DateValue value={user.createdAt} /></dd>
        </div>
      </dl>
      <button
        className="admin-user-card__action"
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(user.id)}
      >
        {selected ? 'Detalles seleccionados' : 'Ver detalles'}
      </button>
    </article>
  )
}

function UserDetail({ state, onRetry }) {
  if (state.status === 'idle') {
    return (
      <StateMessage
        mark="01"
        title="Selecciona una cuenta"
        message="Elige una cuenta del listado para consultar su información básica y sus pedidos."
      />
    )
  }

  if (state.status === 'loading') {
    return (
      <StateMessage
        mark="···"
        title="Cargando información"
        message="Consultando el perfil seleccionado."
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StateMessage
        mark="!"
        title="No pudimos cargar la cuenta"
        message={state.error}
        onRetry={onRetry}
      />
    )
  }

  const user = state.data

  return (
    <div className="admin-user-detail">
      <div className="admin-user-detail__heading">
        <div>
          <p className="section-eyebrow">Cuenta seleccionada</p>
          <h2>{getDisplayName(user)}</h2>
        </div>
        <AccountStatus active={user.activo} />
      </div>

      <dl className="admin-user-detail__grid">
        <div><dt>Nombre</dt><dd>{user.nombre || 'No registrado'}</dd></div>
        <div><dt>Apellido</dt><dd>{user.apellido || 'No registrado'}</dd></div>
        <div><dt>Correo</dt><dd className="admin-user-detail__wrap">{user.email || 'No disponible'}</dd></div>
        <div><dt>Teléfono</dt><dd>{user.telefono || 'No registrado'}</dd></div>
        <div><dt>Rol</dt><dd>{ROLE_LABELS[user.rol]}</dd></div>
        <div><dt>Estado</dt><dd>{user.activo ? 'Cuenta activa' : 'Cuenta inactiva'}</dd></div>
        <div className="admin-user-detail__wide">
          <dt>Fecha de registro</dt>
          <dd><DateValue value={user.createdAt} /></dd>
        </div>
      </dl>
    </div>
  )
}

function AdminOrderCard({ order, expanded, onToggle }) {
  const formattedDate = formatOrderDate(order.createdAt)
  const detailsId = `admin-order-${order.codigoPedido}`
  const observations = typeof order.observaciones === 'string'
    ? order.observaciones.trim()
    : ''

  return (
    <article className="admin-order-card">
      <header className="admin-order-card__header">
        <div>
          <p>Pedido</p>
          <h3>{order.codigoPedido}</h3>
        </div>
        <span className="admin-order-card__status">{order.estado}</span>
      </header>

      <dl className="admin-order-card__summary">
        <div>
          <dt>Fecha</dt>
          <dd>
            {formattedDate.dateTime ? (
              <time dateTime={formattedDate.dateTime}>{formattedDate.label}</time>
            ) : formattedDate.label}
          </dd>
        </div>
        <div><dt>Total</dt><dd>{formatProductPrice(order.total)}</dd></div>
      </dl>

      {observations && (
        <div className="admin-order-card__observations">
          <h4>Observaciones</h4>
          <p>{observations}</p>
        </div>
      )}

      <button
        className="admin-order-card__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => onToggle(order.codigoPedido)}
      >
        {expanded ? 'Ocultar productos' : 'Ver productos'}
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="admin-order-card__products" id={detailsId}>
          <h4>Productos del pedido</h4>
          {order.detalles.length > 0 ? (
            <ul>
              {order.detalles.map((detail) => (
                <li key={detail.id}>
                  <div>
                    <h5>{detail.nombreProducto}</h5>
                    <p>
                      {detail.cantidad} × {formatProductPrice(detail.precioUnitario)}
                    </p>
                  </div>
                  <strong>{formatProductPrice(detail.subtotal)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay productos disponibles en este pedido.</p>
          )}
        </div>
      )}
    </article>
  )
}

function OrdersSection({ state, expandedCodes, onRetry, onToggle }) {
  let content

  if (state.status === 'idle') {
    content = (
      <StateMessage
        mark="02"
        title="Pedidos sin consultar"
        message="Selecciona una cuenta para consultar sus pedidos registrados."
      />
    )
  } else if (state.status === 'loading') {
    content = (
      <StateMessage
        mark="···"
        title="Cargando pedidos"
        message="Consultando el historial de la cuenta seleccionada."
      />
    )
  } else if (state.status === 'error') {
    content = (
      <StateMessage
        mark="!"
        title="No pudimos cargar los pedidos"
        message={state.error}
        onRetry={onRetry}
      />
    )
  } else if (state.data.length === 0) {
    content = (
      <StateMessage
        mark="0"
        title="Esta cuenta no tiene pedidos"
        message="No existen pedidos registrados para el usuario seleccionado."
      />
    )
  } else {
    content = (
      <div className="admin-orders__list" role="list">
        {state.data.map((order) => (
          <div key={order.codigoPedido} role="listitem">
            <AdminOrderCard
              order={order}
              expanded={expandedCodes.has(order.codigoPedido)}
              onToggle={onToggle}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <section
      className="admin-orders"
      aria-labelledby="admin-orders-title"
      aria-busy={state.status === 'loading'}
    >
      <div className="admin-panel-heading">
        <div>
          <p className="section-eyebrow">Actividad comercial</p>
          <h2 id="admin-orders-title">Pedidos del usuario</h2>
        </div>
        {state.status === 'success' && (
          <span>{state.data.length} {state.data.length === 1 ? 'pedido' : 'pedidos'}</span>
        )}
      </div>
      <div aria-live="polite">{content}</div>
    </section>
  )
}

function AdminPage() {
  const { token } = useAuth()
  const [usersState, setUsersState] = useState({
    data: [],
    status: 'loading',
    error: null,
  })
  const [usersRequest, setUsersRequest] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const activeSelectionRef = useRef(null)
  const [detailState, setDetailState] = useState(INITIAL_DETAIL_STATE)
  const [detailRequest, setDetailRequest] = useState(0)
  const [ordersState, setOrdersState] = useState(INITIAL_ORDERS_STATE)
  const [ordersRequest, setOrdersRequest] = useState(0)
  const [expandedOrderCodes, setExpandedOrderCodes] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    obtenerUsuariosAdmin(token, { signal: controller.signal })
      .then((users) => {
        if (controller.signal.aborted) return
        setUsersState({ data: users, status: 'success', error: null })
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') return
        setUsersState({
          data: [],
          status: 'error',
          error: getErrorMessage(error, 'No fue posible consultar las cuentas.'),
        })
      })

    return () => controller.abort()
  }, [token, usersRequest])

  useEffect(() => {
    if (!selectedUserId) return undefined

    const controller = new AbortController()

    obtenerUsuarioAdmin(token, selectedUserId, { signal: controller.signal })
      .then((user) => {
        if (controller.signal.aborted || activeSelectionRef.current !== selectedUserId) return
        setDetailState({ data: user, status: 'success', error: null })
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          error?.name === 'AbortError' ||
          activeSelectionRef.current !== selectedUserId
        ) return
        setDetailState({
          data: null,
          status: 'error',
          error: getErrorMessage(error, 'No fue posible consultar la cuenta.'),
        })
      })

    return () => controller.abort()
  }, [detailRequest, selectedUserId, token])

  useEffect(() => {
    if (!selectedUserId) return undefined

    const controller = new AbortController()

    obtenerPedidosUsuarioAdmin(token, selectedUserId, { signal: controller.signal })
      .then((orders) => {
        if (controller.signal.aborted || activeSelectionRef.current !== selectedUserId) return
        setOrdersState({ data: orders, status: 'success', error: null })
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          error?.name === 'AbortError' ||
          activeSelectionRef.current !== selectedUserId
        ) return
        setOrdersState({
          data: [],
          status: 'error',
          error: getErrorMessage(error, 'No fue posible consultar los pedidos.'),
        })
      })

    return () => controller.abort()
  }, [ordersRequest, selectedUserId, token])

  const visibleUsers = useMemo(() => {
    const term = normalizeSearch(search.trim())

    return usersState.data.filter((user) => {
      if (roleFilter && user.rol !== roleFilter) return false
      if (statusFilter && String(user.activo) !== statusFilter) return false
      if (!term) return true

      return normalizeSearch([
        user.nombre,
        user.apellido,
        user.email,
      ].filter(Boolean).join(' ')).includes(term)
    })
  }, [roleFilter, search, statusFilter, usersState.data])

  const handleSelectUser = (userId) => {
    if (userId === selectedUserId) return

    activeSelectionRef.current = userId
    setExpandedOrderCodes(new Set())
    setDetailState({ data: null, status: 'loading', error: null })
    setOrdersState({ data: [], status: 'loading', error: null })
    setSelectedUserId(userId)
  }

  const handleToggleOrder = (orderCode) => {
    setExpandedOrderCodes((current) => {
      const next = new Set(current)

      if (next.has(orderCode)) {
        next.delete(orderCode)
      } else {
        next.add(orderCode)
      }

      return next
    })
  }

  const retryUsers = () => {
    setUsersState({ data: [], status: 'loading', error: null })
    setUsersRequest((current) => current + 1)
  }

  const retryDetail = () => {
    setDetailState({ data: null, status: 'loading', error: null })
    setDetailRequest((current) => current + 1)
  }

  const retryOrders = () => {
    setOrdersState({ data: [], status: 'loading', error: null })
    setOrdersRequest((current) => current + 1)
  }

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div className="section-shell admin-shell admin-hero__content">
          <div>
            <p className="section-eyebrow">Administración NexVitria</p>
            <h1>Panel administrativo</h1>
            <p>Consulta y supervisa las cuentas y pedidos registrados en NexVitria.</p>
          </div>
          <div className="admin-hero__metric" aria-live="polite">
            <span>Usuarios registrados</span>
            <strong>{usersState.status === 'success' ? usersState.data.length : '—'}</strong>
          </div>
        </div>
      </section>

      <div className="section-shell admin-shell admin-workspace">
        <section className="admin-directory" aria-labelledby="admin-users-title">
          <div className="admin-panel-heading">
            <div>
              <p className="section-eyebrow">Directorio</p>
              <h2 id="admin-users-title">Cuentas registradas</h2>
              <p className="admin-directory__description">
                Busca y consulta la información de los usuarios de NexVitria.
              </p>
            </div>
          </div>

          <div className="admin-filters" aria-label="Filtros de cuentas">
            <div className="admin-field admin-field--search">
              <label htmlFor="admin-search">Buscar usuarios</label>
              <input
                id="admin-search"
                type="search"
                value={search}
                maxLength="100"
                placeholder="Buscar por nombre o correo"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-role">Rol</label>
              <select id="admin-role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="">Todos los roles</option>
                <option value="CLIENTE">Cliente</option>
                <option value="EMPLEADO">Empleado</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="admin-status">Estado</label>
              <select id="admin-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </section>

        <div className="admin-layout">
          <section
            className="admin-users"
            aria-labelledby="admin-users-title"
            aria-busy={usersState.status === 'loading'}
          >

            {usersState.status === 'loading' && (
              <div aria-live="polite">
                <StateMessage mark="···" title="Cargando cuentas" message="Consultando los usuarios registrados." />
              </div>
            )}

            {usersState.status === 'error' && (
              <div aria-live="assertive">
                <StateMessage
                  mark="!"
                  title="No pudimos cargar las cuentas"
                  message={usersState.error}
                  onRetry={retryUsers}
                />
              </div>
            )}

            {usersState.status === 'success' && (
              <>
                <p className="admin-users__result-count" aria-live="polite">
                  {visibleUsers.length} {visibleUsers.length === 1 ? 'cuenta visible' : 'cuentas visibles'}
                </p>
                {visibleUsers.length > 0 ? (
                  <div className="admin-users__list" role="list">
                    {visibleUsers.map((user) => (
                      <div key={user.id} role="listitem">
                        <UserCard
                          user={user}
                          selected={selectedUserId === user.id}
                          onSelect={handleSelectUser}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <StateMessage
                    mark="0"
                    title={usersState.data.length === 0 ? 'No hay cuentas registradas' : 'No hay coincidencias'}
                    message={usersState.data.length === 0
                      ? 'Aún no existen usuarios disponibles para consultar.'
                      : 'Ajusta la búsqueda o los filtros para ver otros resultados.'}
                  />
                )}
              </>
            )}
          </section>

          <div className="admin-inspector">
            <section
              className="admin-detail"
              aria-labelledby="admin-detail-title"
              aria-busy={detailState.status === 'loading'}
            >
              <h2 className="admin-visually-hidden" id="admin-detail-title">Detalle de usuario</h2>
              <div aria-live="polite">
                <UserDetail state={detailState} onRetry={retryDetail} />
              </div>
            </section>

            <OrdersSection
              state={ordersState}
              expandedCodes={expandedOrderCodes}
              onRetry={retryOrders}
              onToggle={handleToggleOrder}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

export default AdminPage
