import { useState } from 'react'
import './productImage.css'

function ProductImage({ src, alt, className = '', fit = 'contain', ...imageProps }) {
  const [failedSource, setFailedSource] = useState(null)
  const hasValidSource = typeof src === 'string' && src.trim() && failedSource !== src
  const normalizedFit = fit === 'cover' ? 'cover' : 'contain'

  if (!hasValidSource) {
    return (
      <div
        className={`product-image-fallback ${className}`.trim()}
        role="img"
        aria-label={`${alt}. Imagen no disponible`}
      >
        <span aria-hidden="true">NV</span>
        <small>Imagen no disponible</small>
      </div>
    )
  }

  return (
    <img
      {...imageProps}
      className={`product-image product-image--${normalizedFit} ${className}`.trim()}
      src={src}
      alt={alt}
      onError={() => setFailedSource(src)}
    />
  )
}

export default ProductImage
