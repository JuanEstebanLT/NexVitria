-- =====================================================
-- NexVitria
-- Migración 006: Edición de datos personales
-- =====================================================

-- Autoriza al backend a actualizar exclusivamente los campos
-- personales editables. No concede permisos sobre rol, activo,
-- avatar_path, id, email ni ningún otro campo protegido.
GRANT UPDATE (
  nombre,
  apellido,
  telefono
)
ON TABLE public.profiles
TO service_role;

