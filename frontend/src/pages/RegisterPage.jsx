import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/authContext.js'
import '../components/auth/auth.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const phoneCharactersPattern = /^\+?[\d\s().-]+$/

function isValidOptionalPhone(value) {
  const trimmedValue = value.trim()

  if (!trimmedValue) return true
  if (!phoneCharactersPattern.test(trimmedValue)) return false

  const digits = trimmedValue.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

const passwordChecks = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (value) => value.length >= 8 },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (value) => /[A-Z]/.test(value) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (value) => /[a-z]/.test(value) },
  { id: 'number', label: 'Un número', test: (value) => /\d/.test(value) },
  { id: 'special', label: 'Un carácter especial', test: (value) => /[^A-Za-z0-9]/.test(value) },
]

function RegisterPage() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationPending, setConfirmationPending] = useState(false)
  const { register, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const passwordRequirements = useMemo(() => passwordChecks.map((requirement) => ({
    ...requirement,
    met: requirement.test(form.password),
  })), [form.password])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio.'
    if (!form.apellido.trim()) nextErrors.apellido = 'El apellido es obligatorio.'
    if (!isValidOptionalPhone(form.telefono)) {
      nextErrors.telefono = 'Ingresa un teléfono válido de entre 7 y 15 dígitos.'
    }
    if (!EMAIL_REGEX.test(form.email.trim())) nextErrors.email = 'Ingresa un correo electrónico válido.'
    if (!passwordChecks.every((requirement) => requirement.test(form.password))) {
      nextErrors.password = 'La contraseña todavía no cumple todos los requisitos.'
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const isValid = validate()

    if (!isValid) {
      setServerError('Revisa los campos indicados antes de crear tu cuenta.')
      return
    }

    setIsSubmitting(true)
    setServerError('')

    try {
      const result = await register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      if (result.requiresEmailConfirmation || !result.user) {
        setConfirmationPending(true)
      } else {
        navigate('/', { replace: true })
      }
    } catch (error) {
      setServerError(error.message || 'No fue posible crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmationPending) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-confirmation" aria-labelledby="confirmation-title">
          <span className="auth-confirmation__icon" aria-hidden="true">✓</span>
          <p className="section-eyebrow">Registro recibido</p>
          <h1 id="confirmation-title">Cuenta creada</h1>
          <p>Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.</p>
          <Link className="ui-button ui-button--primary" to="/login">Ir a Iniciar sesión</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--wide" aria-labelledby="register-title">
        <div className="auth-card__intro">
          <p className="section-eyebrow">Únete a NexVitria</p>
          <h1 id="register-title">Crear cuenta</h1>
          <p>Completa tus datos para registrar una cuenta personal.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__columns">
            <Input label="Nombre" name="nombre" autoComplete="given-name" value={form.nombre} error={errors.nombre} onChange={updateField} disabled={isSubmitting} required />
            <Input label="Apellido" name="apellido" autoComplete="family-name" value={form.apellido} error={errors.apellido} onChange={updateField} disabled={isSubmitting} required />
          </div>
          <Input label="Teléfono (opcional)" name="telefono" type="tel" inputMode="tel" autoComplete="tel" value={form.telefono} error={errors.telefono} helperText="Entre 7 y 15 dígitos; puedes usar espacios, guiones o el prefijo +." onChange={updateField} disabled={isSubmitting} />
          <Input label="Correo electrónico" name="email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={updateField} disabled={isSubmitting} required />

          <div className="password-field password-field--login">
            <Input label="Contraseña" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} error={errors.password} onChange={updateField} disabled={isSubmitting} required />
            <button className="password-field__toggle" type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          <ul className="password-requirements" aria-label="Requisitos de contraseña">
            {passwordRequirements.map((requirement) => (
              <li className={requirement.met ? 'password-requirement--met' : ''} key={requirement.id}>
                <span aria-hidden="true">{requirement.met ? '✓' : '○'}</span> {requirement.label}
              </li>
            ))}
          </ul>

          <Input label="Confirmar contraseña" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} error={errors.confirmPassword} onChange={updateField} disabled={isSubmitting} required />

          {serverError && <p className="auth-message auth-message--error" role="alert">{serverError}</p>}

          <Button type="submit" className="auth-form__submit" variant="accent" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="auth-card__alternate">
          ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
