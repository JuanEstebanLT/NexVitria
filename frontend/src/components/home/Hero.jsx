import { Link } from 'react-router-dom'
import HomeIcon from './HomeIcon.jsx'
import HeroCarousel from './HeroCarousel.jsx'
import './home.css'

function Hero() {
  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="hero__inner section-shell">
        <div className="hero__content">
          <span className="section-tag">Bienestar natural para cada día</span>
          <h1 id="hero-title">
            Cuidado natural para sentirte bien <span>cada día.</span>
          </h1>
          <p>
            Descubre productos naturales y de cuidado personal seleccionados para
            acompañar tu bienestar, tu higiene y tus rutinas diarias.
          </p>
          <div className="hero__actions" aria-label="Acciones principales">
            <Link className="ui-button ui-button--accent" to="/productos">
              Explorar productos
            </Link>
            <Link className="ui-button ui-button--secondary" to="/#nosotros">
              Conocer NexVitria
            </Link>
          </div>
          <ul className="hero__highlights" aria-label="Valores de NexVitria">
            <li><HomeIcon name="wellness" /> Ingredientes de origen natural</li>
            <li><HomeIcon name="check" /> Selección cuidadosa</li>
            <li><HomeIcon name="visibility" /> Información clara</li>
          </ul>
        </div>

        <HeroCarousel />
      </div>
    </section>
  )
}

export default Hero
