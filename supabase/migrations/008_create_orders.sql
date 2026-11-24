-- =====================================================
-- NexVitria
-- Migración 008: Pedidos y creación atómica con stock
-- =====================================================


-- =====================================================
-- TABLA: pedidos
-- =====================================================

CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  subtotal NUMERIC(16, 2) NOT NULL,
  total NUMERIC(16, 2) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- TABLA: pedido_detalles
-- =====================================================

CREATE TABLE public.pedido_detalles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL,
  producto_id UUID NOT NULL,
  nombre_producto TEXT NOT NULL,
  precio_unitario NUMERIC(12, 2) NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =====================================================
-- RESTRICCIONES
-- =====================================================

ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_cliente_id_fkey
FOREIGN KEY (cliente_id)
REFERENCES public.profiles(id)
ON DELETE RESTRICT;

ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_estado_check
CHECK (estado = 'PENDIENTE');

ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_subtotal_check
CHECK (subtotal > 0);

ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_total_check
CHECK (total > 0 AND total = subtotal);

ALTER TABLE public.pedido_detalles
ADD CONSTRAINT pedido_detalles_pedido_id_fkey
FOREIGN KEY (pedido_id)
REFERENCES public.pedidos(id)
ON DELETE CASCADE;

ALTER TABLE public.pedido_detalles
ADD CONSTRAINT pedido_detalles_producto_id_fkey
FOREIGN KEY (producto_id)
REFERENCES public.productos(id)
ON DELETE RESTRICT;

ALTER TABLE public.pedido_detalles
ADD CONSTRAINT pedido_detalles_cantidad_check
CHECK (cantidad BETWEEN 1 AND 10);

ALTER TABLE public.pedido_detalles
ADD CONSTRAINT pedido_detalles_precio_unitario_check
CHECK (precio_unitario > 0);

ALTER TABLE public.pedido_detalles
ADD CONSTRAINT pedido_detalles_subtotal_check
CHECK (
  subtotal > 0
  AND subtotal = precio_unitario * cantidad
);

ALTER TABLE public.pedido_detalles
ADD CONSTRAINT pedido_detalles_pedido_producto_key
UNIQUE (pedido_id, producto_id);


-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_pedidos_cliente_id
ON public.pedidos(cliente_id);

CREATE INDEX idx_pedidos_created_at
ON public.pedidos(created_at);

-- La restricción UNIQUE (pedido_id, producto_id) ya cubre
-- las consultas por pedido_id sin duplicar otro índice.
CREATE INDEX idx_pedido_detalles_producto_id
ON public.pedido_detalles(producto_id);


-- =====================================================
-- TRIGGER updated_at
-- =====================================================

CREATE TRIGGER set_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.pedidos
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pedido_detalles
ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- PERMISOS DATA API
-- =====================================================

-- El frontend no accede directamente a las tablas de pedidos.
REVOKE ALL ON TABLE public.pedidos
FROM anon, authenticated;

REVOKE ALL ON TABLE public.pedido_detalles
FROM anon, authenticated;

-- El backend administra los pedidos mediante service_role.
GRANT SELECT, INSERT, UPDATE
ON TABLE public.pedidos
TO service_role;

GRANT SELECT, INSERT
ON TABLE public.pedido_detalles
TO service_role;


-- =====================================================
-- FUNCIÓN RPC: crear pedido
-- =====================================================

CREATE OR REPLACE FUNCTION public.crear_pedido(
  p_cliente_id UUID,
  p_items JSONB,
  p_observaciones TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_cliente_rol public.user_role;
  v_cliente_activo BOOLEAN;
  v_item JSONB;
  v_item_numero INTEGER := 0;
  v_producto_id UUID;
  v_cantidad_numerica NUMERIC;
  v_cantidad INTEGER;
  v_producto_ids UUID[] := ARRAY[]::UUID[];
  v_cantidades INTEGER[] := ARRAY[]::INTEGER[];
  v_producto RECORD;
  v_productos_bloqueados INTEGER := 0;
  v_posicion INTEGER;
  v_subtotal NUMERIC(16, 2) := 0;
  v_pedido_id UUID;
  v_nombre_producto TEXT;
  v_precio_unitario NUMERIC(12, 2);
  v_resultado JSONB;
BEGIN
  -- Validar el perfil de aplicación que será dueño del pedido.
  IF p_cliente_id IS NULL THEN
    RAISE EXCEPTION 'El cliente_id es obligatorio'
      USING ERRCODE = '22023';
  END IF;

  SELECT pr.rol, pr.activo
  INTO v_cliente_rol, v_cliente_activo
  FROM public.profiles AS pr
  WHERE pr.id = p_cliente_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El perfil del cliente no existe'
      USING ERRCODE = '22023';
  END IF;

  IF NOT v_cliente_activo THEN
    RAISE EXCEPTION 'El perfil del cliente está inactivo'
      USING ERRCODE = '22023';
  END IF;

  IF v_cliente_rol <> 'CLIENTE'::public.user_role THEN
    RAISE EXCEPTION 'El perfil indicado no tiene rol CLIENTE'
      USING ERRCODE = '22023';
  END IF;

  -- Validar y normalizar producto_id + cantidad sin confiar
  -- en nombres, precios, subtotales ni totales del solicitante.
  IF p_items IS NULL THEN
    RAISE EXCEPTION 'Los items del pedido son obligatorios'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Los items del pedido deben ser un arreglo JSON'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido debe contener al menos un item'
      USING ERRCODE = '22023';
  END IF;

  FOR v_item IN
    SELECT items.value
    FROM pg_catalog.jsonb_array_elements(p_items) AS items(value)
  LOOP
    v_item_numero := v_item_numero + 1;

    IF pg_catalog.jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'El item % debe ser un objeto JSON', v_item_numero
        USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_object_keys(v_item) AS claves(clave)
      WHERE claves.clave NOT IN ('producto_id', 'cantidad')
    ) THEN
      RAISE EXCEPTION
        'El item % solo puede contener producto_id y cantidad',
        v_item_numero
        USING ERRCODE = '22023';
    END IF;

    IF NOT (v_item ? 'producto_id')
       OR pg_catalog.jsonb_typeof(v_item -> 'producto_id') <> 'string' THEN
      RAISE EXCEPTION 'El producto_id del item % es obligatorio y debe ser texto',
        v_item_numero
        USING ERRCODE = '22023';
    END IF;

    BEGIN
      v_producto_id := (v_item ->> 'producto_id')::UUID;
    EXCEPTION
      WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'El producto_id del item % no es un UUID válido',
          v_item_numero
          USING ERRCODE = '22023';
    END;

    IF NOT (v_item ? 'cantidad')
       OR pg_catalog.jsonb_typeof(v_item -> 'cantidad') <> 'number' THEN
      RAISE EXCEPTION 'La cantidad del item % es obligatoria y debe ser numérica',
        v_item_numero
        USING ERRCODE = '22023';
    END IF;

    v_cantidad_numerica := (v_item ->> 'cantidad')::NUMERIC;

    IF v_cantidad_numerica <> pg_catalog.trunc(v_cantidad_numerica) THEN
      RAISE EXCEPTION 'La cantidad del item % debe ser un número entero',
        v_item_numero
        USING ERRCODE = '22023';
    END IF;

    IF v_cantidad_numerica <= 0 THEN
      RAISE EXCEPTION 'La cantidad del item % debe ser mayor que cero',
        v_item_numero
        USING ERRCODE = '22023';
    END IF;

    IF v_cantidad_numerica > 10 THEN
      RAISE EXCEPTION 'La cantidad del item % no puede ser mayor que 10',
        v_item_numero
        USING ERRCODE = '22023';
    END IF;

    v_cantidad := v_cantidad_numerica::INTEGER;

    IF v_producto_id = ANY (v_producto_ids) THEN
      RAISE EXCEPTION 'El producto % está duplicado en el pedido', v_producto_id
        USING ERRCODE = '22023';
    END IF;

    v_producto_ids := pg_catalog.array_append(v_producto_ids, v_producto_id);
    v_cantidades := pg_catalog.array_append(v_cantidades, v_cantidad);
  END LOOP;

  -- Bloquear todos los productos en un orden determinista antes de escribir.
  -- Los bloqueos se conservan hasta finalizar la transacción de la llamada RPC.
  FOR v_producto IN
    SELECT
      p.id,
      p.nombre,
      p.precio,
      p.stock,
      p.disponible,
      p.activo,
      c.id AS categoria_existente_id,
      c.activo AS categoria_activa
    FROM public.productos AS p
    LEFT JOIN public.categorias AS c
      ON c.id = p.categoria_id
    WHERE p.id = ANY (v_producto_ids)
    ORDER BY p.id
    FOR UPDATE OF p
  LOOP
    v_productos_bloqueados := v_productos_bloqueados + 1;
    v_posicion := pg_catalog.array_position(v_producto_ids, v_producto.id);
    v_cantidad := v_cantidades[v_posicion];

    IF NOT v_producto.activo THEN
      RAISE EXCEPTION 'El producto % está inactivo', v_producto.id
        USING ERRCODE = '22023';
    END IF;

    IF NOT v_producto.disponible THEN
      RAISE EXCEPTION 'El producto % no está disponible', v_producto.id
        USING ERRCODE = '22023';
    END IF;

    IF v_producto.categoria_existente_id IS NULL THEN
      RAISE EXCEPTION 'La categoría del producto % no existe', v_producto.id
        USING ERRCODE = '22023';
    END IF;

    IF NOT v_producto.categoria_activa THEN
      RAISE EXCEPTION 'La categoría del producto % está inactiva', v_producto.id
        USING ERRCODE = '22023';
    END IF;

    IF v_producto.stock < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_producto.id
        USING ERRCODE = '22023';
    END IF;

    v_subtotal := v_subtotal + (v_producto.precio * v_cantidad);
  END LOOP;

  IF v_productos_bloqueados <> pg_catalog.array_length(v_producto_ids, 1) THEN
    RAISE EXCEPTION 'Uno o más productos solicitados no existen'
      USING ERRCODE = '22023';
  END IF;

  -- El subtotal y el total se derivan exclusivamente de precios bloqueados en BD.
  INSERT INTO public.pedidos (
    cliente_id,
    estado,
    subtotal,
    total,
    observaciones
  )
  VALUES (
    p_cliente_id,
    'PENDIENTE',
    v_subtotal,
    v_subtotal,
    p_observaciones
  )
  RETURNING id INTO v_pedido_id;

  -- Descontar stock y persistir snapshots históricos del producto.
  FOR v_posicion IN 1 .. pg_catalog.array_length(v_producto_ids, 1)
  LOOP
    v_producto_id := v_producto_ids[v_posicion];
    v_cantidad := v_cantidades[v_posicion];

    UPDATE public.productos AS p
    SET
      stock = p.stock - v_cantidad,
      disponible = CASE
        WHEN p.stock - v_cantidad = 0 THEN FALSE
        ELSE p.disponible
      END
    WHERE p.id = v_producto_id
      AND p.stock >= v_cantidad
    RETURNING p.nombre, p.precio
    INTO v_nombre_producto, v_precio_unitario;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No fue posible descontar el stock del producto %',
        v_producto_id
        USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.pedido_detalles (
      pedido_id,
      producto_id,
      nombre_producto,
      precio_unitario,
      cantidad,
      subtotal
    )
    VALUES (
      v_pedido_id,
      v_producto_id,
      v_nombre_producto,
      v_precio_unitario,
      v_cantidad,
      v_precio_unitario * v_cantidad
    );
  END LOOP;

  SELECT pg_catalog.jsonb_build_object(
    'id', pe.id,
    'cliente_id', pe.cliente_id,
    'estado', pe.estado,
    'subtotal', pe.subtotal,
    'total', pe.total,
    'observaciones', pe.observaciones,
    'created_at', pe.created_at,
    'detalles', COALESCE(
      (
        SELECT pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', pd.id,
            'producto_id', pd.producto_id,
            'nombre_producto', pd.nombre_producto,
            'precio_unitario', pd.precio_unitario,
            'cantidad', pd.cantidad,
            'subtotal', pd.subtotal
          )
          ORDER BY pd.created_at, pd.id
        )
        FROM public.pedido_detalles AS pd
        WHERE pd.pedido_id = pe.id
      ),
      '[]'::JSONB
    )
  )
  INTO v_resultado
  FROM public.pedidos AS pe
  WHERE pe.id = v_pedido_id;

  RETURN v_resultado;
END;
$$;


-- =====================================================
-- PERMISO EXECUTE DEL RPC
-- =====================================================

-- PostgreSQL concede EXECUTE a PUBLIC por defecto al crear funciones.
REVOKE ALL
ON FUNCTION public.crear_pedido(UUID, JSONB, TEXT)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.crear_pedido(UUID, JSONB, TEXT)
FROM anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.crear_pedido(UUID, JSONB, TEXT)
TO service_role;
