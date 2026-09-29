import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/catalogContext.js'
import { getCategoryMetadata } from '../../data/productMetadata.js'
import HomeIcon from './HomeIcon.jsx'
import './home.css'

function CategoriesPreview() {
  const { categories, categoriesStatus, retryCategories } = useCatalog()

  return (
    <section className="home-section solutions" id="categorias" aria-labelledby="solutions-title">
      <div className="section-shell">
        <div className="section-heading">
          <span className="section-tag">Explora por categoría</span>
          <h2 id="solutions-title">Todo lo que necesitas para tu rutina de cuidado</h2>
          <p>Encuentra productos naturales organizados para acompañar tu cabello, tu piel y tu bienestar diario.</p>
        </div>

        {categoriesStatus === 'loading' && (
          <p role="status" aria-live="polite">Cargando categorías…</p>
        )}

        {categoriesStatus === 'error' && (
          <div role="alert">
            <p>No pudimos cargar las categorías.</p>
            <button className="ui-button ui-button--accent" type="button" onClick={retryCategories}>
              Reintentar
            </button>
          </div>
        )}

        {categoriesStatus === 'success' && categories.length === 0 && (
          <p role="status">No hay categorías disponibles.</p>
        )}

        {categoriesStatus === 'success' && categories.length > 0 && (
          <div className="solutions-grid">
            {categories.map((category, index) => {
              const metadata = getCategoryMetadata(category.name)

              return (
                <article className="solution-card" key={category.id}>
                  <div className="solution-card__top">
                    <span className="icon-frame">
                      <HomeIcon name={metadata?.icon ?? 'wellness'} />
                    </span>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3>{category.name}</h3>
                  <p>
                    {metadata?.description ?? 'Explora los productos disponibles en esta categoría.'}
                  </p>
                  <Link
                    className="solution-card__link"
                    to={`/productos?categoria=${encodeURIComponent(category.id)}`}
                    aria-label={`Ver productos de ${category.name}`}
                  >
                    Ver categoría <b aria-hidden="true">→</b>
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default CategoriesPreview
