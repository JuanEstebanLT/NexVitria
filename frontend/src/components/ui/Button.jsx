import './ui.css'

function Button({ children, className = '', variant = 'primary', type = 'button', ...props }) {
  const classes = ['ui-button', `ui-button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  )
}

export default Button
