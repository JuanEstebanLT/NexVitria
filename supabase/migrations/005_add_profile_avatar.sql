-- =====================================================
-- NexVitria
-- Migración 005: Avatar persistente de perfil
-- =====================================================

-- Agrega la ruta persistente del avatar al perfil.
-- IF NOT EXISTS permite volver a ejecutar la migración
-- sin fallar si la columna ya fue creada previamente.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- El backend utiliza service_role para actualizar únicamente
-- la columna del avatar, sin ampliar UPDATE al resto del perfil.
GRANT UPDATE (avatar_path)
ON TABLE public.profiles
TO service_role;

-- Crea el bucket privado para almacenar avatares.
-- Cada usuario utilizará una ruta controlada por la aplicación,
-- por ejemplo: <userId>/avatar.jpg
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'avatars',
  'avatars',
  FALSE,
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