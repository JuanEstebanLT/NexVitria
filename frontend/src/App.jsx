import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/authContext.js'
import { CatalogProvider } from './context/CatalogContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { PresenceProvider } from './context/PresenceContext.jsx'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'
import ScrollToTop from './components/layout/ScrollToTop.jsx'
import HomePage from './pages/HomePage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import CartPage from './pages/CartPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import './App.css'

function AuthenticatedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="route-loading" aria-live="polite">
        <span className="route-loading__indicator" aria-hidden="true" />
        <p>Validando tu sesión…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash ? encodeURIComponent(location.hash) : ''}`
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return children
}

function ClientRoute({
  children,
  title = 'Carrito no disponible',
  description = 'El carrito está disponible exclusivamente para cuentas con rol CLIENTE.',
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="route-loading" aria-live="polite">
        <span className="route-loading__indicator" aria-hidden="true" />
        <p>Validando tu sesión…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (user?.activo !== true || user?.rol !== 'CLIENTE') {
    return (
      <main className="route-access-state">
        <section aria-labelledby="client-access-title">
          <p className="section-eyebrow">Acceso de clientes</p>
          <h1 id="client-access-title">{title}</h1>
          <p>{description}</p>
          <Link className="ui-button ui-button--primary" to="/">Volver al inicio</Link>
        </section>
      </main>
    )
  }

  return children
}

function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="route-loading" aria-live="polite">
        <span className="route-loading__indicator" aria-hidden="true" />
        <p>Validando tu sesión…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (user?.activo !== true || user?.rol !== 'ADMINISTRADOR') {
    return (
      <main className="route-access-state">
        <section aria-labelledby="admin-access-title">
          <p className="section-eyebrow">Acceso administrativo</p>
          <h1 id="admin-access-title">Panel no disponible</h1>
          <p>Esta sección está disponible exclusivamente para cuentas ADMINISTRADOR activas.</p>
          <Link className="ui-button ui-button--primary" to="/">Volver al inicio</Link>
        </section>
      </main>
    )
  }

  return children
}

function AppRoutes() {
  const { pathname } = useLocation()
  const pageClassName = pathname.startsWith('/productos') || pathname === '/carrito' || pathname.startsWith('/mi-cuenta') || pathname.startsWith('/admin')
    ? 'app-shell app-shell--catalog'
    : pathname === '/login' || pathname === '/registro'
      ? 'app-shell app-shell--auth'
    : 'home-page'

  return (
    <div className={pageClassName}>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/productos/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/carrito" element={<ClientRoute><CartPage /></ClientRoute>} />
        <Route path="/mi-cuenta" element={<AuthenticatedRoute><AccountPage /></AuthenticatedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route
          path="/mi-cuenta/pedidos/:codigo"
          element={(
            <ClientRoute
              title="Pedido no disponible"
              description="Los pedidos están disponibles exclusivamente para cuentas CLIENTE."
            >
              <OrderDetailPage />
            </ClientRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PresenceProvider>
          <CatalogProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </CatalogProvider>
        </PresenceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
