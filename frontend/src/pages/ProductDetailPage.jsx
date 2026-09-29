import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ProductCard from '../components/products/ProductCard.jsx'
import ProductImage from '../components/products/ProductImage.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/authContext.js'
import { useCart } from '../context/cartContext.js'
import { useCatalog } from '../context/catalogContext.js'
import { attachProductMetadata } from '../data/productMetadata.js'
import { obtenerProductoPorId } from '../services/catalogService.js'
import { formatProductPrice } from '../utils/formatters.js'
import '../components/products/products.css'

const MAX_QUANTITY = 10

function getRelatedProducts(currentProduct, products) {
  const sameCategory = products.filter(
    (product) =>
      product.id !== currentProduct.id &&
      product.category?.id === currentProduct.category?.id,
  )
  const complementary = products.filter(
    (product) =>
      product.id !== currentProduct.id &&
      product.category?.id !== currentProduct.category?.id,
  )

  return [...sameCategory, ...complementary].slice(0, 4)
}

function ProductBreadcrumb({ productName }) {
  return (
    <nav className="product-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><Link to="/">Inicio</Link></li>
        <li aria-hidden="true">/</li>
        <li><Link to="/productos">Productos</Link></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{productName}</li>
      </ol>
    </nav>
  )
}

function ProductNotFound() {
  return (
    <main className="product-detail-page">
      <div className="section-shell">
        <ProductBreadcrumb productName="Producto no encontrado" />
        <section className="product-not-found" aria-labelledby="not-found-title">
          <span className="product-not-found__icon" aria-hidden="true">?</span>
          <p className="section-eyebrow">Catálogo NexVitria</p>
          <h1 id="not-found-title">Producto no encontrado</h1>
          <p>No encontramos el producto que estás buscando.</p>
          <div className="product-not-found__actions">
            <Link className="ui-button ui-button--primary" to="/productos">
              Volver al catálogo
            </Link>
            <Link className="ui-button ui-button--secondary" to="/">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

function ProductRequestState({ isLoading, onRetry }) {
  return (
    <main className="product-detail-page">
      <div className="section-shell">
        <ProductBreadcrumb productName={isLoading ? 'Cargando producto' : 'Error de catálogo'} />
        <section className="product-not-found" aria-live="polite">
          <span className="product-not-found__icon" aria-hidden="true">
            {isLoading ? '…' : '!'}
          </span>
          <p className="section-eyebrow">Catálogo NexVitria</p>
          <h1>{isLoading ? 'Estamos cargando el producto.' : 'No pudimos cargar el producto.'}</h1>
          <p>
            {isLoading
              ? 'Consultando la información más reciente del catálogo.'
              : 'Verifica tu conexión e intenta nuevamente.'}
          </p>
          {!isLoading && (
            <div className="product-not-found__actions">
              <button className="ui-button ui-button--primary" type="button" onClick={onRetry}>
                Reintentar
              </button>
              <Link className="ui-button ui-button--secondary" to="/productos">
                Volver al catálogo
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function ProductDetailContent({ product, relatedProducts }) {
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState(null)
  const { user, isAuthenticated, isLoading } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const maxQuantity = Math.min(MAX_QUANTITY, Math.max(0, product.stock))
  const isPurchasable = product.active && product.available && maxQuantity > 0
  const loginTarget = `/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`
  const availabilityLabel = !product.active || !product.available
    ? 'No disponible'
    : product.stock <= 0
      ? 'Agotado'
      : `${product.stock} ${product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`

  const validateCartAccess = () => {
    if (!isPurchasable) {
      setFeedback({ message: 'Este producto no está disponible para agregar al carrito.' })
      return false
    }

    if (!isAuthenticated) {
      setFeedback({
        message: 'Inicia sesión como cliente para agregar productos al carrito.',
        showLogin: true,
      })
      return false
    }

    if (user?.activo !== true || user?.rol !== 'CLIENTE') {
      setFeedback({ message: 'El carrito está disponible para cuentas de cliente.' })
      return false
    }

    return true
  }

  const addProduct = () => {
    if (!validateCartAccess()) return false

    const added = addItem(product, quantity)

    if (!added) {
      setFeedback({ message: 'No fue posible agregar más unidades de este producto.' })
      return false
    }

    return true
  }

  const handleAddToCart = () => {
    if (!addProduct()) return
    setFeedback({ message: 'Producto agregado al carrito.' })
  }

  const handleBuyNow = () => {
    if (!addProduct()) return
    navigate('/carrito')
  }

  return (
    <main className="product-detail-page">
      <div className="section-shell">
        <ProductBreadcrumb productName={product.name} />

        <section className="product-detail" aria-labelledby="product-detail-title">
          <div className="product-detail__image-stage">
            <ProductImage
              src={product.imageUrl}
              alt={`Presentación completa de ${product.name}`}
            />
          </div>

          <div className="product-detail__summary">
            <div className="product-detail__meta">
              <span className="product-detail__category">
                {product.category?.name ?? 'Sin categoría'}
              </span>
              {product.badge && <span className="product-detail__badge">{product.badge}</span>}
            </div>

            <h1 id="product-detail-title">{product.name}</h1>
            <p className="product-detail__description">{product.description}</p>

            <div className="product-detail__price">
              <span>Precio</span>
              <strong>{formatProductPrice(product.price)}</strong>
            </div>

            <p className={`product-detail__availability${isPurchasable ? '' : ' product-detail__availability--unavailable'}`}>
              <span aria-hidden="true" />
              {availabilityLabel}
            </p>

            <div className="product-detail__purchase">
              <div className="quantity-selector" role="group" aria-labelledby="quantity-label">
                <span id="quantity-label">Cantidad</span>
                <div className="quantity-selector__controls">
                  <button
                    type="button"
                    aria-label="Disminuir cantidad"
                    disabled={!isPurchasable || quantity === 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  >
                    −
                  </button>
                  <output aria-live="polite" aria-label={`Cantidad seleccionada: ${quantity}`}>
                    {quantity}
                  </output>
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    disabled={!isPurchasable || quantity >= maxQuantity}
                    onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="product-detail__actions">
                <Button variant="accent" disabled={isLoading || !isPurchasable} onClick={handleAddToCart}>
                  Agregar al carrito
                </Button>
                <Button variant="secondary" disabled={isLoading || !isPurchasable} onClick={handleBuyNow}>
                  Comprar ahora
                </Button>
              </div>

              <p className="product-detail__action-note">
                Máximo {maxQuantity || 0} unidades para este producto. El checkout todavía no está disponible.
              </p>

              {feedback && (
                <div className="product-action-feedback" role="status" aria-live="polite">
                  <div>
                    <p>{feedback.message}</p>
                    {feedback.showLogin && (
                      <Link className="product-action-feedback__link" to={loginTarget}>
                        Iniciar sesión
                      </Link>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar aviso"
                    onClick={() => setFeedback(null)}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="product-information" aria-labelledby="product-information-title">
          <div className="product-information__heading">
            <p className="section-eyebrow">Información del producto</p>
            <h2 id="product-information-title">Conoce mejor este producto</h2>
          </div>

          <div className="product-information__grid">
            <article className="product-info-card">
              <span className="product-info-card__number">01</span>
              <h3>Descripción</h3>
              <p>{product.description}</p>
            </article>

            {product.features.length > 0 && (
              <article className="product-info-card">
                <span className="product-info-card__number">02</span>
                <h3>Características</h3>
                <ul>
                  {product.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </article>
            )}

            {product.presentation && (
              <article className="product-info-card">
                <span className="product-info-card__number">03</span>
                <h3>Presentación</h3>
                <p><strong>{product.presentation}</strong></p>
                <small>Información visual complementaria del catálogo.</small>
              </article>
            )}

            {product.usage && (
              <article className="product-info-card">
                <span className="product-info-card__number">04</span>
                <h3>Rutina de cuidado</h3>
                <p>{product.usage}</p>
              </article>
            )}

            <aside className="purchase-confidence" aria-labelledby="purchase-confidence-title">
              <div>
                <p className="section-eyebrow">Compra con confianza</p>
                <h3 id="purchase-confidence-title">Una experiencia clara y sencilla</h3>
              </div>
              <ul>
                <li>Información fácil de consultar</li>
                <li>Selección de cuidado organizada</li>
                <li>Experiencia visual consistente</li>
              </ul>
            </aside>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="related-products" aria-labelledby="related-products-title">
            <div className="related-products__heading">
              <div>
                <p className="section-eyebrow">Continúa explorando</p>
                <h2 id="related-products-title">También te puede interesar</h2>
              </div>
              <Link to="/productos">Ver todo el catálogo <span aria-hidden="true">→</span></Link>
            </div>

            <div className="catalog-grid related-products__grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function ProductDetailPage() {
  const { id } = useParams()
  const { products } = useCatalog()
  const [requestVersion, setRequestVersion] = useState(0)
  const [result, setResult] = useState({
    requestedId: null,
    status: 'loading',
    product: null,
  })
  const currentResult = result.requestedId === id
    ? result
    : { requestedId: id, status: 'loading', product: null }

  useEffect(() => {
    const controller = new AbortController()

    obtenerProductoPorId(id, { signal: controller.signal })
      .then((product) => {
        if (controller.signal.aborted) return
        setResult({
          requestedId: id,
          status: 'success',
          product: attachProductMetadata(product),
        })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setResult({
          requestedId: id,
          status: error?.status === 400 || error?.status === 404 ? 'not-found' : 'error',
          product: null,
        })
      })

    return () => controller.abort()
  }, [id, requestVersion])

  useEffect(() => {
    const previousTitle = document.title
    document.title = currentResult.status === 'success'
      ? `${currentResult.product.name} | NexVitria`
      : currentResult.status === 'not-found'
        ? 'Producto no encontrado | NexVitria'
        : 'Catálogo | NexVitria'

    return () => {
      document.title = previousTitle
    }
  }, [currentResult.product, currentResult.status])

  const retry = () => {
    setResult({ requestedId: id, status: 'loading', product: null })
    setRequestVersion((current) => current + 1)
  }

  if (currentResult.status === 'loading') {
    return <ProductRequestState isLoading />
  }

  if (currentResult.status === 'not-found') {
    return <ProductNotFound />
  }

  if (currentResult.status === 'error') {
    return <ProductRequestState isLoading={false} onRetry={retry} />
  }

  const relatedProducts = getRelatedProducts(currentResult.product, products)

  return (
    <ProductDetailContent
      key={currentResult.product.id}
      product={currentResult.product}
      relatedProducts={relatedProducts}
    />
  )
}

export default ProductDetailPage
