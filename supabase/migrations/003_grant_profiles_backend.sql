-- =====================================================
-- NexVitria
-- Migración 003: Permiso del backend sobre profiles
-- =====================================================

-- Permitir que el backend consulte los perfiles
-- utilizando el rol privilegiado de Supabase.
GRANT SELECT
ON TABLE public.profiles
TO service_role;