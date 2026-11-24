const productPriceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const orderDateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
})

export function formatProductPrice(price) {
  const numericPrice = Number(price)
  return productPriceFormatter.format(Number.isFinite(numericPrice) ? numericPrice : 0)
}

export function formatOrderDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return {
      dateTime: null,
      label: 'Fecha no disponible',
    }
  }

  return {
    dateTime: value,
    label: orderDateFormatter.format(date),
  }
}
