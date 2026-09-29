import { useEffect, useMemo, useState } from 'react'
import nexVitriaSymbol from '../../assets/brand/nexvitria-symbol.png'
import { useCatalog } from '../../context/catalogContext.js'
import ProductImage from '../products/ProductImage.jsx'

const AUTOPLAY_DELAY = 6000

function CarouselArrow({ direction }) {
  const path = direction === 'previous' ? 'm14.5 5-7 7 7 7' : 'm9.5 5 7 7-7 7'

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function HeroCatalogState({ status, onRetry }) {
  const hasError = status === 'error'

  return (
    <div className="hero-carousel" role="status" aria-live="polite">
      <img className="hero-carousel__symbol" src={nexVitriaSymbol} alt="" />
      <article className="hero-carousel__slide hero-carousel__slide--hair hero-carousel__slide--active">
        <div className="hero-carousel__copy">
          <span>Catálogo NexVitria</span>
          <h2>{hasError ? 'Catálogo temporalmente no disponible' : 'Preparando productos'}</h2>
          <p>
            {hasError
              ? 'No pudimos consultar el catálogo en este momento.'
              : 'Estamos consultando la selección disponible.'}
          </p>
          {hasError && (
            <button className="ui-button ui-button--accent" type="button" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
        <div className="carousel-product-visual">
          <ProductImage src={null} alt="Producto del catálogo NexVitria" />
        </div>
      </article>
    </div>
  )
}

function HeroCarousel() {
  const { products, productsStatus, retryProducts } = useCatalog()
  const [activeSlide, setActiveSlide] = useState(0)
  const [isHoverPaused, setIsHoverPaused] = useState(false)
  const [isFocusPaused, setIsFocusPaused] = useState(false)
  const [isPausedByUser, setIsPausedByUser] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const slides = useMemo(
    () => products
      .filter((product) => Number.isInteger(product.heroOrder))
      .sort((first, second) => first.heroOrder - second.heroOrder),
    [products],
  )
  const isInteractionPaused = isHoverPaused || isFocusPaused
  const safeActiveSlide = slides.length > 0 ? activeSlide % slides.length : 0

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setPrefersReducedMotion(motionPreference.matches)

    updateMotionPreference()
    motionPreference.addEventListener('change', updateMotionPreference)

    return () => motionPreference.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (
      slides.length <= 1 ||
      prefersReducedMotion ||
      isInteractionPaused ||
      isPausedByUser
    ) {
      return undefined
    }

    const autoplayTimer = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, AUTOPLAY_DELAY)

    return () => window.clearTimeout(autoplayTimer)
  }, [safeActiveSlide, isInteractionPaused, isPausedByUser, prefersReducedMotion, slides.length])

  if (productsStatus !== 'success' || slides.length === 0) {
    return (
      <HeroCatalogState
        status={productsStatus === 'success' ? 'error' : productsStatus}
        onRetry={retryProducts}
      />
    )
  }

  const showSlide = (index) => {
    setActiveSlide((index + slides.length) % slides.length)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showSlide(safeActiveSlide - 1)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      showSlide(safeActiveSlide + 1)
    }
  }

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsFocusPaused(false)
    }
  }

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Colecciones de cuidado NexVitria"
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHoverPaused(true)}
      onMouseLeave={() => setIsHoverPaused(false)}
      onFocusCapture={() => setIsFocusPaused(true)}
      onBlurCapture={handleBlur}
    >
      <img className="hero-carousel__symbol" src={nexVitriaSymbol} alt="" />

      <div className="hero-carousel__viewport">
        {slides.map((slide, index) => {
          const isActive = index === safeActiveSlide

          return (
            <article
              className={`hero-carousel__slide hero-carousel__slide--${slide.heroVariant}${isActive ? ' hero-carousel__slide--active' : ''}`}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${slides.length}`}
              aria-hidden={!isActive}
              key={slide.id}
            >
              <div className="hero-carousel__copy">
                <span>{slide.category?.name ?? 'Catálogo NexVitria'}</span>
                <h2>{slide.name}</h2>
                <p>{slide.description}</p>
              </div>
              <div className="carousel-product-visual">
                <ProductImage
                  src={slide.imageUrl}
                  alt={`Presentación completa de ${slide.name}`}
                  width="1254"
                  height="1254"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            </article>
          )
        })}
      </div>

      <div className="hero-carousel__controls">
        <button
          className="carousel-control carousel-control--arrow"
          type="button"
          aria-label="Mostrar slide anterior"
          onClick={() => showSlide(safeActiveSlide - 1)}
        >
          <CarouselArrow direction="previous" />
        </button>

        <div className="carousel-dots" role="group" aria-label="Seleccionar slide">
          {slides.map((slide, index) => (
            <button
              type="button"
              className="carousel-dot"
              aria-label={`Mostrar ${slide.name}`}
              aria-pressed={index === safeActiveSlide}
              onClick={() => showSlide(index)}
              key={slide.id}
            />
          ))}
        </div>

        <button
          className="carousel-control carousel-control--arrow"
          type="button"
          aria-label="Mostrar slide siguiente"
          onClick={() => showSlide(safeActiveSlide + 1)}
        >
          <CarouselArrow direction="next" />
        </button>

        <button
          className="carousel-control carousel-control--pause"
          type="button"
          aria-label={
            prefersReducedMotion
              ? 'Carrusel automático desactivado por preferencia de movimiento reducido'
              : isPausedByUser
                ? 'Reanudar carrusel automático'
                : 'Pausar carrusel automático'
          }
          aria-pressed={isPausedByUser}
          disabled={prefersReducedMotion}
          onClick={() => setIsPausedByUser((current) => !current)}
        >
          <span aria-hidden="true">{isPausedByUser ? '▶' : 'Ⅱ'}</span>
        </button>
      </div>

      <p
        className="sr-only"
        aria-live={isInteractionPaused || isPausedByUser ? 'polite' : 'off'}
        aria-atomic="true"
      >
        {slides[safeActiveSlide].category?.name}: {slides[safeActiveSlide].name}
      </p>
    </div>
  )
}

export default HeroCarousel
