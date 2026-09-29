import { Link } from 'react-router-dom'
import { formatProductPrice } from '../../utils/formatters.js'
import ProductImage from './ProductImage.jsx'
import './products.css'

function ProductCard({ product }) {
  const isPurchasable = product.active && product.available && product.stock > 0

  return (
    <article className="catalog-product-card">
      <div className="catalog-product-card__media">
        <ProductImage
          src={product.imageUrl}
          alt={`Presentación de ${product.name}`}
          fit="cover"
          loading="lazy"
        />
      </div>

      <div className="catalog-product-card__content">
        <div className="catalog-product-card__meta">
          <p className="catalog-product-card__category">
            {product.category?.name ?? 'Sin categoría'}
          </p>
          {(product.badge || !isPurchasable) && (
            <span className="catalog-product-card__badge">
              {isPurchasable ? product.badge : 'Agotado'}
            </span>
          )}
        </div>
        <h2>{product.name}</h2>
        <p className="catalog-product-card__description">{product.description}</p>

        <div className="catalog-product-card__footer">
          <div className="catalog-product-card__price">
            <span>Precio</span>
            <strong>{formatProductPrice(product.price)}</strong>
          </div>
          <Link
            className="ui-button ui-button--secondary catalog-product-card__action"
            to={`/productos/${product.id}`}
            aria-label={`Ver detalle de ${product.name}`}
          >
            Ver producto
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
