import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from '../components/products/ProductImage.jsx'
import Button from '../components/ui/Button.jsx'
import { useCart } from '../context/cartContext.js'
import { formatProductPrice } from '../utils/formatters.js'
import '../components/cart/cart.css'

function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    totalItems,
    subtotal,
    getProductQuantityLimit,
    isCartLoading,
    cartError,
    retryCart,
  } = useCart()
  const [feedback, setFeedback] = useState('')

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
                          <button type="button" aria-label={`Disminuir cantidad de ${product.name}`} disabled={quantity === 1} onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                          <output aria-live="polite" aria-label={`Cantidad: ${quantity}`}>{quantity}</output>
                          <button type="button" aria-label={`Aumentar cantidad de ${product.name}`} disabled={quantity >= quantityLimit} onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                        </div>
                      </div>
                      <button className="cart-item__remove" type="button" onClick={() => removeItem(product.id)}>
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
              <div className="cart-summary__total"><dt>Subtotal</dt><dd>{formatProductPrice(subtotal)}</dd></div>
            </dl>
            <p>
              El precio mostrado es informativo. Al implementar pedidos, el backend
              volverá a validar precio y stock desde la base de datos.
            </p>
            <Button variant="accent" onClick={() => setFeedback('El proceso de compra se implementará próximamente.')}>
              Continuar compra
            </Button>
            {feedback && <p className="cart-summary__feedback" role="status" aria-live="polite">{feedback}</p>}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default CartPage
