import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/authContext.js'
import '../components/auth/auth.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getSafeRedirect(value) {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/'

  try {
    const parsedRedirect = new URL(value, window.location.origin)

    if (parsedRedirect.origin !== window.location.origin) return '/'
    return `${parsedRedirect.pathname}${parsedRedirect.search}${parsedRedirect.hash}`
  } catch {
    return '/'
  }
}

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirectTo = getSafeRedirect(searchParams.get('redirect'))

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const nextErrors = {}

    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Ingresa un correo electrónico válido.'
    }

    if (!form.password) {
      nextErrors.password = 'Ingresa tu contraseña.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setServerError('')

    try {
      await login(
        form.email.trim().toLowerCase(),
        form.password,
      )
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(error.message || 'No fue posible iniciar sesión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--login" aria-labelledby="login-title">
        <div className="auth-card__intro">
          <p className="section-eyebrow">Tu cuenta NexVitria</p>
          <h1 id="login-title">Iniciar sesión</h1>
          <p>Accede con el correo y la contraseña de tu cuenta.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            error={errors.email}
            onChange={updateField}
            disabled={isSubmitting}
            required
          />

          <div className="password-field password-field--login">
            <Input
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              error={errors.password}
              onChange={updateField}
              disabled={isSubmitting}
              required
            />
            <button
              className="password-field__toggle"
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {serverError && <p className="auth-message auth-message--error" role="alert">{serverError}</p>}

          <Button type="submit" className="auth-form__submit" variant="accent" disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="auth-card__alternate">
          ¿Aún no tienes cuenta? <Link to="/registro">Crear cuenta</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
