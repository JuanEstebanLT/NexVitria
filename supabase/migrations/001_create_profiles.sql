-- =====================================================
-- NexVitria
-- Migración 001: Perfiles de usuario y roles
-- =====================================================

-- Crear los roles disponibles dentro de NexVitria
CREATE TYPE public.user_role AS ENUM (
  'CLIENTE',
  'EMPLEADO',
  'ADMINISTRADOR'
);

-- Crear tabla de perfiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  rol public.user_role NOT NULL DEFAULT 'CLIENTE',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permitir que cada usuario autenticado consulte su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = id
);

-- Función que crea automáticamente el perfil
-- cuando se registra un usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nombre,
    apellido
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', '')
  );

  RETURN NEW;
END;
$$;

-- Ejecutar la función después de crear un usuario
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();