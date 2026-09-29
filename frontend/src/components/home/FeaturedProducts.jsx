import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/catalogContext.js'
import { formatProductPrice } from '../../utils/formatters.js'
import ProductImage from '../products/ProductImage.jsx'
import './home.css'

function FeaturedProducts() {
  const { products, productsStatus, retryProducts } = useCatalog()
  const featuredProducts = products.filter((product) => product.featured)

  return (
    <section className="home-section featured" id="productos" aria-labelledby="products-title">
      <div className="section-shell">
        <div className="featured__heading">
          <div className="section-heading">
            <p className="section-eyebrow">Favoritos de cuidado</p>
            <h2 id="products-title">Productos destacados</h2>
            <p>Descubre una selección de esenciales naturales para complementar tu rutina.</p>
          </div>
          <span className="mock-label">Precios del catálogo</span>
        </div>

        {productsStatus === 'loading' && (
          <p role="status" aria-live="polite">Cargando productos destacados…</p>
        )}

        {productsStatus === 'error' && (
          <div role="alert">
            <p>No pudimos cargar los productos destacados.</p>
            <button className="ui-button ui-button--secondary" type="button" onClick={retryProducts}>
              Reintentar
            </button>
          </div>
        )}

        {productsStatus === 'success' && featuredProducts.length === 0 && (
          <p role="status">No hay productos destacados disponibles.</p>
        )}

        {productsStatus === 'success' && featuredProducts.length > 0 && (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="featured-product-media">
                  <ProductImage
                    src={product.imageUrl}
                    alt={`Presentación completa de ${product.name}`}
                    fit="cover"
                    width="1254"
                    height="1254"
                    loading="lazy"
                  />
                </div>
                <div className="product-card__content">
                  <div className="product-card__meta">
                    <p className="product-category">{product.category?.name ?? 'Sin categoría'}</p>
                    {product.badge && <span className="product-badge">{product.badge}</span>}
                  </div>
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-card__footer">
                    <span><small>Precio</small><strong>{formatProductPrice(product.price)}</strong></span>
                    <Link
                      className="ui-button ui-button--secondary"
                      to={`/productos/${product.id}`}
                      aria-label={`Ver detalle de ${product.name}`}
                    >
                      Ver producto
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
