import { useId } from 'react'
import './ui.css'

function Input({
  className = '',
  error,
  helperText,
  id,
  label,
  'aria-describedby': ariaDescribedBy,
  ...props
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const helperId = helperText ? `${inputId}-helper` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const description = [ariaDescribedBy, helperId, errorId].filter(Boolean).join(' ')

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        aria-describedby={description || undefined}
        aria-invalid={error ? 'true' : undefined}
        className={['ui-input', className].filter(Boolean).join(' ')}
        id={inputId}
      />
      {helperText && (
        <span className="ui-field__helper" id={helperId}>
          {helperText}
        </span>
      )}
      {error && (
        <span className="ui-field__error" id={errorId} role="alert">
          <span aria-hidden="true">!</span> {error}
        </span>
      )}
    </div>
  )
}

export default Input
