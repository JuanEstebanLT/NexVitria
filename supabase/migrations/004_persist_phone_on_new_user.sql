-- =====================================================
-- NexVitria
-- Migración 004: Persistir teléfono en perfiles nuevos
-- =====================================================

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
    apellido,
    telefono
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'telefono'), '')
  );

  RETURN NEW;
END;
$$;
