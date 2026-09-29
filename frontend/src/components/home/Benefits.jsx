import HomeIcon from './HomeIcon.jsx'
import './home.css'

const BENEFITS = [
  {
    icon: 'wellness',
    title: 'Selección cuidadosa',
    description: 'Productos elegidos para acompañar tus rutinas de cuidado con confianza.',
  },
  {
    icon: 'growth',
    title: 'Bienestar cotidiano',
    description: 'Opciones pensadas para cuidar de ti de forma sencilla todos los días.',
  },
  {
    icon: 'visibility',
    title: 'Información clara',
    description: 'Detalles fáciles de consultar para que puedas elegir con mayor seguridad.',
  },
  {
    icon: 'check',
    title: 'Compra sencilla',
    description: 'Una experiencia ordenada, cercana y preparada para ayudarte en cada paso.',
  },
]

function Benefits() {
  return (
    <section className="home-section benefits" id="beneficios" aria-labelledby="benefits-title">
      <div className="section-shell">
        <div className="section-heading section-heading--centered">
          <p className="section-eyebrow">Propuesta de valor</p>
          <h2 id="benefits-title">Tu bienestar empieza con elecciones conscientes</h2>
          <p>Reunimos cuidado, claridad y cercanía para que cada producto encuentre un lugar natural en tu rutina.</p>
        </div>

        <div className="benefits-grid">
          {BENEFITS.map((benefit, index) => (
            <article className="benefit-card" key={benefit.title}>
              <span className="benefit-card__number">0{index + 1}</span>
              <span className="icon-frame"><HomeIcon name={benefit.icon} /></span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Benefits
