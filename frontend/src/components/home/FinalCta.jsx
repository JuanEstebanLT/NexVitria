import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import './home.css'

function FinalCta() {
  return (
    <section className="final-cta home-section" aria-labelledby="final-cta-title">
      <div className="section-shell">
        <div className="final-cta__panel">
          <span className="final-cta__shape final-cta__shape--one" aria-hidden="true" />
          <span className="final-cta__shape final-cta__shape--two" aria-hidden="true" />
          <div className="final-cta__content">
            <p>Visibilidad. Conexión. Crecimiento.</p>
            <h2 id="final-cta-title">Encuentra productos pensados para tu bienestar</h2>
            <span>
              Descubre opciones naturales para cuidar tu cabello, tu piel y tus rutinas
              de cada día.
            </span>
          </div>
          <div className="final-cta__actions">
            <Link className="ui-button ui-button--accent" to="/productos">
              Explorar productos
            </Link>
            <Button className="final-cta__secondary" variant="secondary">
              Crear cuenta
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCta
