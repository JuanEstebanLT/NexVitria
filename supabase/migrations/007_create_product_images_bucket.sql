-- =====================================================
-- NexVitria
-- Migración 007: Bucket público de imágenes de productos
-- =====================================================

-- El backend es el único encargado de crear y eliminar objetos mediante
-- service_role. El bucket es público para que el catálogo pueda consumir
-- directamente las URLs almacenadas en public.productos.imagen_url.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id)
DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
