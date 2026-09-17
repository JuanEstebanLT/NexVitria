-- =====================================================
-- NexVitria
-- Migración 002: Categorías y productos
-- =====================================================


-- =====================================================
-- TABLA: categorias
-- =====================================================

CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- TABLA: productos
-- =====================================================

CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL
    REFERENCES public.categorias(id)
    ON DELETE RESTRICT,

  nombre TEXT NOT NULL,
  descripcion TEXT,

  precio NUMERIC(12, 2) NOT NULL
    CHECK (precio > 0),

  stock INTEGER NOT NULL DEFAULT 0
    CHECK (stock >= 0),

  disponible BOOLEAN NOT NULL DEFAULT TRUE,

  imagen_url TEXT,

  activo BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_productos_categoria
ON public.productos(categoria_id);

CREATE INDEX idx_productos_nombre
ON public.productos(nombre);


-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =====================================================
-- TRIGGERS updated_at
-- =====================================================

CREATE TRIGGER set_categorias_updated_at
BEFORE UPDATE ON public.categorias
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TRIGGER set_productos_updated_at
BEFORE UPDATE ON public.productos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.categorias
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.productos
ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- PERMISOS DATA API
-- =====================================================

-- Evitar acceso directo desde clientes públicos
REVOKE ALL ON TABLE public.categorias
FROM anon, authenticated;

REVOKE ALL ON TABLE public.productos
FROM anon, authenticated;


-- Permitir acceso desde nuestro backend
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.categorias
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.productos
TO service_role;