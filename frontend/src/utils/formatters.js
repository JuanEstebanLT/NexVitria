const productPriceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatProductPrice(price) {
  const numericPrice = Number(price)
  return productPriceFormatter.format(Number.isFinite(numericPrice) ? numericPrice : 0)
}
