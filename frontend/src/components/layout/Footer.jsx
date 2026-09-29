import { Link } from 'react-router-dom'
import nexVitriaSymbol from '../../assets/brand/nexvitria-symbol.png'
import './layout.css'

const FOOTER_NAVIGATION = [
  { to: '/', label: 'Inicio' },
  { to: '/productos', label: 'Productos' },
  { to: '/#categorias', label: 'Categorías' },
  { to: '/#nosotros', label: 'Nuestra marca' },
]

const CUSTOMER_CARE_ITEMS = [
  'Preguntas frecuentes',
  'Envíos',
  'Cambios y devoluciones',
  'Privacidad',
  'Términos y condiciones',
]

const LEGAL_ITEMS = [
  'Política de privacidad',
  'Términos y condiciones',
  'Política de envíos',
  'Cambios y devoluciones',
]

// Las URLs se incorporarán únicamente cuando existan perfiles oficiales.
const OFFICIAL_SOCIAL_LINKS = []

function SocialIcon({ name }) {
  if (name === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.6" r="1" className="social-icon__fill" />
      </svg>
    )
  }

  if (name === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8h3V4.4c-.8-.1-1.8-.2-3-.2-3 0-5 1.8-5 5.2V12H6v4h3v8h4v-8h3.2l.8-4h-4V9.8C13 8.6 13.4 8 14 8Z" className="social-icon__fill" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11.7a8 8 0 0 1-11.8 7l-4.2 1 1.1-4a8 8 0 1 1 14.9-4Z" />
      <path d="M9 8.4c.4 2.4 2.2 4.2 4.6 4.7" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner section-shell">
        <section className="footer-brand" aria-labelledby="footer-brand-title">
          <div className="footer-brand__identity">
            <span className="footer-brand__symbol">
              <img
                src={nexVitriaSymbol}
                width="426"
                height="432"
                alt=""
              />
            </span>
            <div>
              <h2 id="footer-brand-title">NexVitria</h2>
              <p className="footer-brand__tagline">Visibilidad. Conexión. Crecimiento.</p>
            </div>
          </div>
          <p className="footer-brand__description">
            Productos naturales y de cuidado personal pensados para acompañar tu
            bienestar y tus rutinas de cada día.
          </p>
        </section>

        <nav
          className="footer-column footer-navigation"
          aria-label="Navegación de NexVitria"
        >
          <h2>NexVitria</h2>
          <ul>
            {FOOTER_NAVIGATION.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <section
          className="footer-column footer-customer-care"
          aria-labelledby="customer-care-title"
        >
          <h2 id="customer-care-title">Atención al cliente</h2>
          <p className="footer-column__note">Secciones informativas en preparación.</p>
          <ul>
            {CUSTOMER_CARE_ITEMS.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="footer-column footer-contact" aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title">Contacto</h2>
          <p>
            Nuestros canales oficiales de atención estarán disponibles próximamente.
          </p>

          {OFFICIAL_SOCIAL_LINKS.length > 0 && (
            <div className="footer-socials">
              <h3>Síguenos</h3>
              <ul>
                {OFFICIAL_SOCIAL_LINKS.map((social) => (
                  <li key={social.name}>
                    <a href={social.href} aria-label={social.label}>
                      <SocialIcon name={social.name} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom__inner section-shell">
          <p>© 2026 NexVitria. Todos los derechos reservados.</p>
          <ul aria-label="Información legal pendiente">
            {LEGAL_ITEMS.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
