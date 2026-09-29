import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/products/ProductCard.jsx'
import brandPanel from '../assets/images/promotional/00_nexvitria_brand_panel.png'
import { useCatalog } from '../context/catalogContext.js'
import '../components/products/products.css'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name-asc', label: 'Nombre A–Z' },
  { value: 'name-desc', label: 'Nombre Z–A' },
]

const normalizeText = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')

function CatalogRequestState({ type, onRetry }) {
  const isLoading = type === 'loading'

  return (
    <div className="catalog-empty" role={isLoading ? 'status' : 'alert'} aria-live="polite">
      <span className="catalog-empty__icon" aria-hidden="true">
        {isLoading ? '…' : '!'}
      </span>
      <h2>{isLoading ? 'Estamos preparando el catálogo.' : 'No pudimos cargar el catálogo.'}</h2>
      <p>
        {isLoading
          ? 'Consultando productos y categorías disponibles.'
          : 'Verifica tu conexión e intenta nuevamente.'}
      </p>
      {!isLoading && (
        <button className="ui-button ui-button--primary" type="button" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

function ProductsPage() {
  const {
    products,
    productsStatus,
    retryProducts,
    categories,
    categoriesStatus,
    retryCategories,
  } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('relevance')
  const requestedCategoryId = searchParams.get('categoria')
  const selectedCategoryId = categories.some(({ id }) => id === requestedCategoryId)
    ? requestedCategoryId
    : 'all'
  const isLoading = productsStatus === 'loading' || categoriesStatus === 'loading'
  const hasError = productsStatus === 'error' || categoriesStatus === 'error'

  const visibleProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm.trim())
    const filteredProducts = products.filter((product) => {
      const matchesCategory =
        selectedCategoryId === 'all' || product.category?.id === selectedCategoryId
      const searchableContent = normalizeText(
        `${product.name} ${product.category?.name ?? ''} ${product.description}`,
      )

      return matchesCategory && searchableContent.includes(normalizedSearch)
    })

    return [...filteredProducts].sort((first, second) => {
      if (sortOrder === 'price-asc') return first.price - second.price
      if (sortOrder === 'price-desc') return second.price - first.price
      if (sortOrder === 'name-asc') return first.name.localeCompare(second.name, 'es')
      if (sortOrder === 'name-desc') return second.name.localeCompare(first.name, 'es')
      return 0
    })
  }, [products, searchTerm, selectedCategoryId, sortOrder])

  const retryCatalog = () => {
    if (productsStatus === 'error') retryProducts()
    if (categoriesStatus === 'error') retryCategories()
  }

  const handleCategoryChange = (categoryId) => {
    const nextParams = new URLSearchParams(searchParams)

    if (categoryId === 'all') {
      nextParams.delete('categoria')
    } else {
      nextParams.set('categoria', categoryId)
    }

    setSearchParams(nextParams, { replace: true })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSortOrder('relevance')
    setSearchParams({}, { replace: true })
  }

  const resultLabel = `${visibleProducts.length} ${
    visibleProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'
  }`

  return (
    <main className="products-page">
      <section className="catalog-hero" aria-labelledby="catalog-title">
        <div className="catalog-hero__panel section-shell">
          <div className="catalog-hero__content">
            <span className="catalog-hero__eyebrow">Catálogo NexVitria</span>
            <h1 id="catalog-title">Productos para tu bienestar diario</h1>
            <p>
              Explora nuestra selección de productos naturales y de cuidado personal
              para acompañar cada momento de tu rutina.
            </p>
            <ul aria-label="Características del catálogo">
              <li>{productsStatus === 'success' ? `${products.length} productos disponibles` : 'Productos seleccionados'}</li>
              <li>{categoriesStatus === 'success' ? `${categories.length} categorías de cuidado` : 'Categorías de cuidado'}</li>
              <li>Imágenes reales del catálogo</li>
            </ul>
          </div>

          <div className="catalog-hero__visual">
            <img
              src={brandPanel}
              alt="NexVitria, naturaleza que te acompaña"
              width="768"
              height="1024"
            />
          </div>
        </div>
      </section>

      <section className="catalog-section section-shell" aria-labelledby="catalog-results-title">
        {isLoading ? (
          <CatalogRequestState type="loading" />
        ) : hasError ? (
          <CatalogRequestState type="error" onRetry={retryCatalog} />
        ) : products.length === 0 ? (
          <div className="catalog-empty" role="status">
            <span className="catalog-empty__icon" aria-hidden="true">0</span>
            <h2>No hay productos disponibles.</h2>
            <p>El catálogo todavía no tiene productos activos para mostrar.</p>
          </div>
        ) : (
          <>
            <div className="catalog-toolbar" aria-label="Herramientas del catálogo">
              <div className="catalog-toolbar__primary">
                <label className="catalog-search" htmlFor="product-search">
                  <span>Buscar en el catálogo</span>
                  <span className="catalog-search__field">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="6.5" />
                      <path d="m16 16 4 4" />
                    </svg>
                    <input
                      id="product-search"
                      type="search"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </span>
                </label>

                <label className="catalog-sort" htmlFor="product-sort">
                  <span>Ordenar por</span>
                  <select
                    id="product-sort"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="catalog-categories">
                <span id="category-filter-label">Filtrar por categoría</span>
                <div
                  className="category-chips"
                  role="group"
                  aria-labelledby="category-filter-label"
                >
                  <button
                    type="button"
                    className={selectedCategoryId === 'all' ? 'category-chip category-chip--active' : 'category-chip'}
                    aria-pressed={selectedCategoryId === 'all'}
                    onClick={() => handleCategoryChange('all')}
                  >
                    Todos
                  </button>
                  {categories.map((category) => {
                    const isSelected = selectedCategoryId === category.id

                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={isSelected ? 'category-chip category-chip--active' : 'category-chip'}
                        aria-pressed={isSelected}
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="catalog-results-heading">
              <div>
                <p className="section-eyebrow">Selección de cuidado</p>
                <h2 id="catalog-results-title">Nuestro catálogo</h2>
              </div>
              <div className="catalog-results-heading__meta">
                <span aria-live="polite">{resultLabel}</span>
                <small>Precios del catálogo</small>
              </div>
            </div>

            {visibleProducts.length > 0 ? (
              <div className="catalog-grid">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="catalog-empty" role="status">
                <span className="catalog-empty__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m16 16 4 4" />
                  </svg>
                </span>
                <h2>No encontramos productos con esos criterios.</h2>
                <p>Prueba con otro término o restablece las opciones del catálogo.</p>
                <button className="ui-button ui-button--primary" type="button" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default ProductsPage
