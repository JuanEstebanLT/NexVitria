import nexVitriaSymbol from '../../assets/brand/nexvitria-symbol.png'
import HomeIcon from './HomeIcon.jsx'
import './home.css'

const TRUST_POINTS = [
  {
    title: 'Cuidado con propósito',
    description: 'Elegimos productos que puedan integrarse con naturalidad a tu bienestar diario.',
  },
  {
    title: 'Información transparente',
    description: 'Comunicamos lo importante de cada producto para ayudarte a elegir con confianza.',
  },
  {
    title: 'Calidad y cercanía',
    description: 'Cuidamos la selección y la experiencia con una mirada siempre orientada a ti.',
  },
]

function TrustSection() {
  return (
    <section className="home-section trust" id="nosotros" aria-labelledby="trust-title">
      <div className="trust__inner section-shell">
        <div className="trust-visual">
          <p className="trust-visual__eyebrow">Compromiso NexVitria</p>
          <div className="trust-visual__symbol">
            <img
              src={nexVitriaSymbol}
              width="426"
              height="432"
              alt="Símbolo oficial de NexVitria"
            />
          </div>
          <div className="trust-visual__statement">
            <span aria-hidden="true">“</span>
            <p>Creemos que el cuidado diario debe ser simple, confiable y consciente.</p>
          </div>
          <div className="trust-visual__signature">
            <span>N</span>
            <p><strong>NexVitria</strong><small>Nuestra forma de acompañarte</small></p>
          </div>
        </div>

        <div className="trust__content">
          <p className="section-eyebrow">Por qué NexVitria</p>
          <h2 id="trust-title">Bienestar que nace de elecciones conscientes</h2>
          <p className="trust__intro">
            En NexVitria reunimos productos naturales y de cuidado personal con una
            experiencia clara, cercana y comprometida con tus rutinas.
          </p>
          <ul className="trust-list">
            {TRUST_POINTS.map((point) => (
              <li key={point.title}>
                <span><HomeIcon name="check" /></span>
                <div><strong>{point.title}</strong><p>{point.description}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default TrustSection
