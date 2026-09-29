import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import nexVitriaLogo from '../../assets/brand/nexvitria-logo.png'
import useActiveSection from '../../hooks/useActiveSection.js'
import { useAuth } from '../../context/authContext.js'
import { useCart } from '../../context/cartContext.js'
import CartIcon from '../ui/CartIcon.jsx'
import UserMenu from '../account/UserMenu.jsx'
import './layout.css'

const NAV_ITEMS = [
  { id: 'inicio', to: '/', label: 'Inicio', type: 'route' },
  { id: 'categorias', to: '/#categorias', label: 'Categorías', type: 'section' },
  { id: 'nosotros', to: '/#nosotros', label: 'Nuestra marca', type: 'section' },
  { id: 'productos', to: '/productos', label: 'Productos', type: 'route' },
]

const OBSERVED_SECTION_IDS = ['inicio', 'beneficios', 'categorias', 'productos', 'nosotros']

function CartLink({ className = '', totalItems, onClick }) {
  const badgeLabel = totalItems > 99 ? '99+' : totalItems

  return (
    <Link
      className={`header-cart ${className}`.trim()}
      to="/carrito"
      aria-label={`Carrito, ${totalItems} ${totalItems === 1 ? 'unidad' : 'unidades'}`}
      onClick={onClick}
    >
      <CartIcon />
      {totalItems > 0 && <span className="header-cart__badge">{badgeLabel}</span>}
    </Link>
  )
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { isAuthenticated, isLoading } = useAuth()
  const { totalItems, isCartAvailable } = useCart()
  const isHome = pathname === '/'
  const isProductsRoute = pathname.startsWith('/productos')
  const { activeSection, setActiveSection } = useActiveSection(
    OBSERVED_SECTION_IDS,
    'inicio',
    isHome,
  )

  const activeItem = isProductsRoute
    ? 'productos'
    : isHome
      ? activeSection === 'categorias' || activeSection === 'nosotros'
        ? activeSection
        : 'inicio'
      : null

  const handleNavigation = (item) => {
    if (item.id !== 'productos') {
      setActiveSection(item.id)
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          className="site-header__brand"
          to="/"
          aria-label="NexVitria, ir al inicio"
          onClick={() => handleNavigation(NAV_ITEMS[0])}
        >
          <img
            src={nexVitriaLogo}
            width="1411"
            height="432"
            alt="NexVitria"
          />
        </Link>

        <div className="site-header__mobile-actions">
          {!isLoading && isCartAvailable && (
            <CartLink className="header-cart--mobile" totalItems={totalItems} />
          )}
          {!isLoading && isAuthenticated && (
            <UserMenu
              className="header-user-menu--mobile"
              onNavigate={() => setIsMenuOpen(false)}
              onOpen={() => setIsMenuOpen(false)}
            />
          )}
          <button
            className="menu-toggle"
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div
          className={`header-navigation${isMenuOpen ? ' header-navigation--open' : ''}`}
          id="primary-navigation"
        >
          <nav aria-label="Navegación principal">
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={
                      activeItem === item.id
                        ? item.type === 'route'
                          ? 'page'
                          : 'location'
                        : undefined
                    }
                    onClick={() => handleNavigation(item)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="header-actions">
            {isLoading ? (
              <span className="header-auth-loading" aria-label="Validando sesión" />
            ) : isAuthenticated ? (
              <>
                {isCartAvailable && (
                  <CartLink
                    className="header-cart--desktop"
                    totalItems={totalItems}
                    onClick={() => setIsMenuOpen(false)}
                  />
                )}
                <UserMenu
                  className="header-user-menu--desktop"
                  onNavigate={() => setIsMenuOpen(false)}
                />
              </>
            ) : (
              <>
                <Link className="header-login" to="/login" onClick={() => setIsMenuOpen(false)}>
                  Iniciar sesión
                </Link>
                <Link className="ui-button ui-button--accent header-register" to="/registro" onClick={() => setIsMenuOpen(false)}>
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
