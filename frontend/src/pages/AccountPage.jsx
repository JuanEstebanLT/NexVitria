import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UserAvatar from '../components/account/UserAvatar.jsx'
import { useAuth } from '../context/authContext.js'
import { usePresence } from '../context/presenceContext.js'
import '../components/account/account.css'

const ROLE_LABELS = {
  CLIENTE: 'Cliente',
  EMPLEADO: 'Empleado',
  ADMINISTRADOR: 'Administrador',
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png'])
const ALLOWED_AVATAR_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])
const MAX_PROFILE_NAME_LENGTH = 80
const MAX_PROFILE_PHONE_LENGTH = 32
const PROFILE_PHONE_CHARACTERS = /^\+?[\d\s().-]+$/

function createPersonalForm(user) {
  return {
    nombre: typeof user?.nombre === 'string' ? user.nombre : '',
    apellido: typeof user?.apellido === 'string' ? user.apellido : '',
    telefono: typeof user?.telefono === 'string' ? user.telefono : '',
  }
}

function validatePersonalForm(values) {
  const nombre = values.nombre.trim()
  const apellido = values.apellido.trim()
  const telefono = values.telefono.trim()
  const errors = {}

  if (!nombre) {
    errors.nombre = 'El nombre es obligatorio.'
  } else if (nombre.length > MAX_PROFILE_NAME_LENGTH) {
    errors.nombre = `El nombre no puede superar ${MAX_PROFILE_NAME_LENGTH} caracteres.`
  }

  if (!apellido) {
    errors.apellido = 'El apellido es obligatorio.'
  } else if (apellido.length > MAX_PROFILE_NAME_LENGTH) {
    errors.apellido = `El apellido no puede superar ${MAX_PROFILE_NAME_LENGTH} caracteres.`
  }

  if (telefono) {
    const digitCount = telefono.replace(/\D/g, '').length

    if (
      telefono.length > MAX_PROFILE_PHONE_LENGTH ||
      !PROFILE_PHONE_CHARACTERS.test(telefono) ||
      digitCount < 7 ||
      digitCount > 15
    ) {
      errors.telefono = 'Ingresa un teléfono válido de entre 7 y 15 dígitos.'
    }
  }

  return {
    errors,
    data: {
      nombre,
      apellido,
      telefono: telefono || null,
    },
  }
}

function cleanValue(value, fallback = 'No registrado') {
  if (typeof value !== 'string') return fallback
  return value.trim() || fallback
}

function DetailIcon({ type }) {
  return (
    <span className="account-detail__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {type === 'name' && (
          <>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6" />
          </>
        )}
        {type === 'surname' && (
          <>
            <rect x="4" y="5" width="16" height="14" rx="3" />
            <circle cx="9" cy="11" r="2" />
            <path d="M6.5 16c.4-1.6 1.2-2.4 2.5-2.4s2.1.8 2.5 2.4M14 10h3.5M14 14h3.5" />
          </>
        )}
        {type === 'email' && (
          <>
            <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
            <path d="m5 7 7 5 7-5" />
          </>
        )}
        {type === 'phone' && (
          <path d="M8.3 4.5 10.1 8 8 9.7c1.2 2.5 3 4.3 5.5 5.5l1.7-2.1 3.5 1.8-.5 3.4c-.1.8-.8 1.3-1.6 1.2C9.9 18.7 5.3 14.1 4.5 7.4c-.1-.8.4-1.5 1.2-1.6l2.6-.3Z" />
        )}
      </svg>
    </span>
  )
}

function OrdersIllustration() {
  return (
    <svg className="account-orders__illustration" viewBox="0 0 280 220" aria-hidden="true" focusable="false">
      <circle className="account-orders__orbit" cx="140" cy="110" r="82" />
      <circle className="account-orders__orbit account-orders__orbit--inner" cx="140" cy="110" r="57" />
      <path className="account-orders__spark" d="M48 61h14M55 54v14M218 164h12M224 158v12" />
      <path className="account-orders__box-top" d="m86 83 54-28 54 28-54 29-54-29Z" />
      <path className="account-orders__box" d="M86 83v61l54 29 54-29V83l-54 29-54-29Z" />
      <path className="account-orders__box-detail" d="M140 112v61M113 69l54 29v31" />
      <path className="account-orders__leaf" d="M168 61c10-16 27-14 34-11-2 13-10 24-29 24M173 73c7-7 14-12 24-17" />
    </svg>
  )
}

function AccountPage() {
  const { user, uploadAvatar, removeAvatar, updateProfile } = useAuth()
  const { status, statusLabel } = usePresence()
  const { hash } = useLocation()
  const avatarInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const [avatarFeedback, setAvatarFeedback] = useState(null)
  const [isEditingPersonalData, setIsEditingPersonalData] = useState(false)
  const [isSavingPersonalData, setIsSavingPersonalData] = useState(false)
  const [personalForm, setPersonalForm] = useState(() => createPersonalForm(user))
  const [personalErrors, setPersonalErrors] = useState({})
  const [personalFeedback, setPersonalFeedback] = useState(null)
  const firstName = cleanValue(user?.nombre)
  const lastName = cleanValue(user?.apellido)
  const fullNameParts = [user?.nombre, user?.apellido]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim())
  const fullName = fullNameParts.join(' ') || 'Nombre no registrado'
  const roleLabel = ROLE_LABELS[user?.rol] || 'No disponible'
  const isAccountActive = user?.activo === true
  const accountStatus = isAccountActive ? 'Cuenta activa' : 'Cuenta inactiva'
  const isClient = user?.rol === 'CLIENTE'
  const hasAvatar = Boolean(user?.avatar_path)
  const avatarIsBusy = isUploadingAvatar || isRemovingAvatar

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => {
    if (hash !== '#pedidos' || !isClient) return undefined

    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById('pedidos')?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [hash, isClient])

  const handleAvatarSelection = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setAvatarFeedback(null)

    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!ALLOWED_AVATAR_TYPES.has(file.type) || !ALLOWED_AVATAR_EXTENSIONS.has(extension)) {
      setAvatarFeedback({ type: 'error', message: 'Solo puedes subir imágenes JPG, JPEG o PNG.' })
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarFeedback({ type: 'error', message: 'La imagen no puede superar los 5 MB.' })
      return
    }

    setPreviewUrl(URL.createObjectURL(file))
    setIsUploadingAvatar(true)

    try {
      await uploadAvatar(file)
      setAvatarFeedback({ type: 'success', message: 'Foto de perfil actualizada.' })
    } catch (error) {
      setAvatarFeedback({
        type: 'error',
        message: error?.message || 'No fue posible actualizar la foto de perfil.',
      })
    } finally {
      setIsUploadingAvatar(false)
      setPreviewUrl(null)
    }
  }

  const handleAvatarRemoval = async () => {
    setAvatarFeedback(null)
    setIsRemovingAvatar(true)

    try {
      await removeAvatar()
      setAvatarFeedback({ type: 'success', message: 'Foto de perfil eliminada.' })
    } catch (error) {
      setAvatarFeedback({
        type: 'error',
        message: error?.message || 'No fue posible eliminar la foto de perfil.',
      })
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  const handleStartPersonalEdit = () => {
    setPersonalForm(createPersonalForm(user))
    setPersonalErrors({})
    setPersonalFeedback(null)
    setIsEditingPersonalData(true)
  }

  const handleCancelPersonalEdit = () => {
    setPersonalForm(createPersonalForm(user))
    setPersonalErrors({})
    setPersonalFeedback(null)
    setIsEditingPersonalData(false)
  }

  const handlePersonalFieldChange = (event) => {
    const { name, value } = event.target
    setPersonalForm((current) => ({ ...current, [name]: value }))
    setPersonalErrors((current) => ({ ...current, [name]: undefined }))
    setPersonalFeedback(null)
  }

  const handlePersonalSubmit = async (event) => {
    event.preventDefault()
    const { errors, data } = validatePersonalForm(personalForm)

    if (Object.keys(errors).length > 0) {
      setPersonalErrors(errors)
      return
    }

    setPersonalErrors({})
    setPersonalFeedback(null)
    setIsSavingPersonalData(true)

    try {
      await updateProfile(data)
      setIsEditingPersonalData(false)
      setPersonalFeedback({ type: 'success', message: 'Datos personales actualizados.' })
    } catch (error) {
      setPersonalFeedback({
        type: 'error',
        message: error?.message || 'No fue posible actualizar los datos personales.',
      })
    } finally {
      setIsSavingPersonalData(false)
    }
  }

  return (
    <main className="account-page">
      <div className="section-shell account-dashboard">
        <header className="account-profile-hero">
          <span className="account-profile-hero__glow" aria-hidden="true" />

          <div className="account-profile-hero__main">
            <div className="account-profile-hero__avatar-column">
              <div className="account-profile-hero__avatar">
                <span className="account-profile-hero__avatar-orbit" aria-hidden="true" />
                <UserAvatar
                  imageUrl={previewUrl || user?.avatar_url}
                  size="large"
                  status={status}
                  statusLabel={statusLabel}
                  label={`Avatar de ${fullName}`}
                />
              </div>

              <div className="account-avatar-actions">
                <input
                  className="account-avatar-input"
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleAvatarSelection}
                  disabled={avatarIsBusy}
                  aria-label={hasAvatar ? 'Seleccionar una nueva foto de perfil' : 'Seleccionar foto de perfil'}
                />
                <button
                  className="account-avatar-action account-avatar-action--primary"
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarIsBusy}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4v-10Z" />
                    <circle cx="12" cy="13" r="3.25" />
                  </svg>
                  {isUploadingAvatar ? 'Subiendo…' : (hasAvatar ? 'Cambiar foto' : 'Agregar foto')}
                </button>
                {hasAvatar && (
                  <button
                    className="account-avatar-action account-avatar-action--remove"
                    type="button"
                    onClick={handleAvatarRemoval}
                    disabled={avatarIsBusy}
                  >
                    {isRemovingAvatar ? 'Eliminando…' : 'Eliminar'}
                  </button>
                )}
              </div>
            </div>

            <div className="account-profile-hero__content">
              <p className="account-profile-hero__eyebrow">Perfil personal</p>
              <h1>Mi cuenta</h1>
              <p className="account-profile-hero__name">{fullName}</p>
              <div className="account-profile-hero__meta">
                <span className="account-profile-hero__role">{roleLabel}</span>
                <span className={`account-presence account-presence--${status.toLowerCase()}`}>
                  <span aria-hidden="true" />
                  {statusLabel}
                </span>
              </div>
              <p className="account-profile-hero__description">
                Administra tu información personal y consulta tu actividad en NexVitria.
              </p>
              {avatarFeedback && (
                <p
                  className={`account-avatar-feedback account-avatar-feedback--${avatarFeedback.type}`}
                  role={avatarFeedback.type === 'error' ? 'alert' : 'status'}
                >
                  {avatarFeedback.message}
                </p>
              )}
            </div>
          </div>

          <div className="account-profile-hero__art" aria-hidden="true">
            <svg viewBox="0 0 360 280" focusable="false">
              <circle cx="230" cy="126" r="92" />
              <circle cx="230" cy="126" r="62" />
              <path d="M88 210 230 34l73 92-73 92-57-72 57-72" />
              <path d="M48 235h245" />
              <circle className="account-profile-hero__art-node" cx="88" cy="210" r="5" />
              <circle className="account-profile-hero__art-node" cx="303" cy="126" r="5" />
            </svg>
          </div>
        </header>

        <div className="account-dashboard__content">
          <section className="account-personal" aria-labelledby="personal-data-title">
            <div className="account-panel-heading">
              <span className="account-panel-heading__mark" aria-hidden="true">01</span>
              <div>
                <p className="section-eyebrow">Perfil</p>
                <h2 id="personal-data-title">Datos personales</h2>
              </div>
              {!isEditingPersonalData && (
                <button
                  className="account-personal__edit"
                  type="button"
                  onClick={handleStartPersonalEdit}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m14.5 5.5 4 4M5 19l2.2-5.2L16.5 4.5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2l-9.3 9.3L5 19Z" />
                  </svg>
                  Editar
                </button>
              )}
            </div>

            {isEditingPersonalData ? (
              <form className="account-personal__form" onSubmit={handlePersonalSubmit} noValidate>
                <div className="account-personal__grid">
                  <div className="account-detail account-detail--editing">
                    <DetailIcon type="name" />
                    <label className="account-personal__field">
                      <span>Nombre</span>
                      <input
                        name="nombre"
                        type="text"
                        value={personalForm.nombre}
                        onChange={handlePersonalFieldChange}
                        maxLength={MAX_PROFILE_NAME_LENGTH}
                        autoComplete="given-name"
                        aria-invalid={Boolean(personalErrors.nombre)}
                        aria-describedby={personalErrors.nombre ? 'profile-name-error' : undefined}
                      />
                      {personalErrors.nombre && (
                        <small id="profile-name-error" className="account-personal__field-error">
                          {personalErrors.nombre}
                        </small>
                      )}
                    </label>
                  </div>
                  <div className="account-detail account-detail--editing">
                    <DetailIcon type="surname" />
                    <label className="account-personal__field">
                      <span>Apellido</span>
                      <input
                        name="apellido"
                        type="text"
                        value={personalForm.apellido}
                        onChange={handlePersonalFieldChange}
                        maxLength={MAX_PROFILE_NAME_LENGTH}
                        autoComplete="family-name"
                        aria-invalid={Boolean(personalErrors.apellido)}
                        aria-describedby={personalErrors.apellido ? 'profile-surname-error' : undefined}
                      />
                      {personalErrors.apellido && (
                        <small id="profile-surname-error" className="account-personal__field-error">
                          {personalErrors.apellido}
                        </small>
                      )}
                    </label>
                  </div>
                  <div className="account-detail account-detail--readonly">
                    <DetailIcon type="email" />
                    <div className="account-personal__readonly">
                      <span>Correo electrónico</span>
                      <strong>{cleanValue(user?.email)}</strong>
                      <small>Solo lectura</small>
                    </div>
                  </div>
                  <div className="account-detail account-detail--editing">
                    <DetailIcon type="phone" />
                    <label className="account-personal__field">
                      <span>Teléfono</span>
                      <input
                        name="telefono"
                        type="tel"
                        value={personalForm.telefono}
                        onChange={handlePersonalFieldChange}
                        maxLength={MAX_PROFILE_PHONE_LENGTH}
                        autoComplete="tel"
                        placeholder="Opcional"
                        aria-invalid={Boolean(personalErrors.telefono)}
                        aria-describedby={personalErrors.telefono ? 'profile-phone-error' : undefined}
                      />
                      {personalErrors.telefono && (
                        <small id="profile-phone-error" className="account-personal__field-error">
                          {personalErrors.telefono}
                        </small>
                      )}
                    </label>
                  </div>
                </div>

                {personalFeedback?.type === 'error' && (
                  <p className="account-personal__feedback account-personal__feedback--error" role="alert">
                    {personalFeedback.message}
                  </p>
                )}

                <div className="account-personal__actions">
                  <button
                    className="account-personal__button account-personal__button--secondary"
                    type="button"
                    onClick={handleCancelPersonalEdit}
                    disabled={isSavingPersonalData}
                  >
                    Cancelar
                  </button>
                  <button
                    className="account-personal__button account-personal__button--primary"
                    type="submit"
                    disabled={isSavingPersonalData}
                  >
                    {isSavingPersonalData ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="account-personal__grid">
                  <div className="account-detail">
                    <DetailIcon type="name" />
                    <div>
                      <dt>Nombre</dt>
                      <dd>{firstName}</dd>
                    </div>
                  </div>
                  <div className="account-detail">
                    <DetailIcon type="surname" />
                    <div>
                      <dt>Apellido</dt>
                      <dd>{lastName}</dd>
                    </div>
                  </div>
                  <div className="account-detail">
                    <DetailIcon type="email" />
                    <div>
                      <dt>Correo electrónico</dt>
                      <dd className="account-detail__email">{cleanValue(user?.email)}</dd>
                    </div>
                  </div>
                  <div className="account-detail">
                    <DetailIcon type="phone" />
                    <div>
                      <dt>Teléfono</dt>
                      <dd>{cleanValue(user?.telefono)}</dd>
                    </div>
                  </div>
                </dl>

                {personalFeedback?.type === 'success' && (
                  <p className="account-personal__feedback account-personal__feedback--success" role="status">
                    {personalFeedback.message}
                  </p>
                )}
              </>
            )}
          </section>

          <aside className="account-summary" aria-labelledby="account-info-title">
            <div className="account-summary__heading">
              <p className="section-eyebrow">Cuenta</p>
              <h2 id="account-info-title">Información de la cuenta</h2>
            </div>

            <dl className="account-summary__list">
              <div className="account-summary__item">
                <dt>Tipo de cuenta</dt>
                <dd><span className="account-badge account-badge--role">{roleLabel}</span></dd>
              </div>
              <div className="account-summary__item">
                <dt>Estado</dt>
                <dd>
                  <span className={`account-badge account-badge--${isAccountActive ? 'active' : 'inactive'}`}>
                    <span className="account-badge__dot" aria-hidden="true" />
                    {accountStatus}
                  </span>
                </dd>
              </div>
              <div className="account-summary__item">
                <dt>Presencia</dt>
                <dd>
                  <span className={`account-summary__presence account-summary__presence--${status.toLowerCase()}`}>
                    <span aria-hidden="true" />
                    {statusLabel}
                  </span>
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        {isClient && (
          <section className="account-orders" id="pedidos" aria-labelledby="orders-title">
            <div className="account-orders__content">
              <div className="account-orders__heading">
                <span aria-hidden="true">02</span>
                <div>
                  <p className="section-eyebrow">Actividad</p>
                  <h2 id="orders-title">Mis pedidos</h2>
                </div>
              </div>
              <div className="account-orders__copy">
                <h3>Aún no tienes pedidos.</h3>
                <p>Cuando realices una compra, podrás consultar aquí el estado y el historial de tus pedidos.</p>
              </div>
              <Link className="ui-button ui-button--primary account-orders__action" to="/productos">Explorar productos</Link>
            </div>

            <div className="account-orders__visual">
              <span className="account-orders__visual-label">NexVitria</span>
              <OrdersIllustration />
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default AccountPage
