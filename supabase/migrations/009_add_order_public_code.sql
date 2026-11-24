-- =====================================================
-- NexVitria
-- Migración 009: Código público estable para pedidos
-- =====================================================


-- =====================================================
-- COLUMNA Y UNICIDAD
-- =====================================================

ALTER TABLE public.pedidos
ADD COLUMN codigo_pedido TEXT;

-- La restricción UNIQUE crea el índice B-tree necesario para las búsquedas
-- por codigo_pedido. No se crea un índice adicional redundante.
ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_codigo_pedido_key
UNIQUE (codigo_pedido);


-- =====================================================
-- GENERACIÓN DEL CÓDIGO PÚBLICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.generar_codigo_pedido(
  p_fecha TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_codigo TEXT;
BEGIN
  LOOP
    v_codigo :=
      'NV-' ||
      pg_catalog.to_char(
        COALESCE(p_fecha, pg_catalog.now()) AT TIME ZONE 'America/Bogota',
        'YYYYMMDD'
      ) ||
      '-' ||
      pg_catalog.upper(
        pg_catalog.substr(
          pg_catalog.replace(pg_catalog.gen_random_uuid()::TEXT, '-', ''),
          1,
          12
        )
      );

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.pedidos AS pe
      WHERE pe.codigo_pedido = v_codigo
    );
  END LOOP;

  RETURN v_codigo;
END;
$$;

CREATE OR REPLACE FUNCTION public.asignar_codigo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- La base de datos siempre genera la referencia e ignora cualquier valor
  -- enviado durante el INSERT.
  NEW.codigo_pedido := public.generar_codigo_pedido(NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pedidos_codigo_pedido
BEFORE INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.asignar_codigo_pedido();


-- =====================================================
-- BACKFILL DE PEDIDOS EXISTENTES
-- =====================================================

DO $$
DECLARE
  v_pedido RECORD;
  v_codigo TEXT;
BEGIN
  -- Evitar que agregar la referencia cambie updated_at de pedidos históricos.
  -- El bloque vuelve a habilitar el trigger también ante cualquier excepción.
  EXECUTE 'ALTER TABLE public.pedidos DISABLE TRIGGER set_pedidos_updated_at';

  FOR v_pedido IN
    SELECT pe.id, pe.created_at
    FROM public.pedidos AS pe
    WHERE pe.codigo_pedido IS NULL
    ORDER BY pe.created_at, pe.id
    FOR UPDATE
  LOOP
    LOOP
      v_codigo := public.generar_codigo_pedido(v_pedido.created_at);

      BEGIN
        UPDATE public.pedidos AS pe
        SET codigo_pedido = v_codigo
        WHERE pe.id = v_pedido.id;

        EXIT;
      EXCEPTION
        WHEN unique_violation THEN
          -- Una colisión aleatoria vuelve a generar el sufijo sin alterar
          -- ninguna otra información del pedido.
          NULL;
      END;
    END LOOP;
  END LOOP;

  EXECUTE 'ALTER TABLE public.pedidos ENABLE TRIGGER set_pedidos_updated_at';
EXCEPTION
  WHEN OTHERS THEN
    EXECUTE 'ALTER TABLE public.pedidos ENABLE TRIGGER set_pedidos_updated_at';
    RAISE;
END;
$$;

ALTER TABLE public.pedidos
ALTER COLUMN codigo_pedido SET NOT NULL;

ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_codigo_pedido_formato_check
CHECK (codigo_pedido ~ '^NV-[0-9]{8}-[A-F0-9]{12}$');


-- =====================================================
-- INMUTABILIDAD DEL CÓDIGO PÚBLICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.proteger_codigo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.codigo_pedido IS DISTINCT FROM OLD.codigo_pedido THEN
    RAISE EXCEPTION 'El código público del pedido no puede modificarse'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_pedidos_codigo_pedido
BEFORE UPDATE OF codigo_pedido ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.proteger_codigo_pedido();


-- =====================================================
-- PERMISOS DE FUNCIONES AUXILIARES
-- =====================================================

REVOKE ALL
ON FUNCTION public.generar_codigo_pedido(TIMESTAMPTZ)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.generar_codigo_pedido(TIMESTAMPTZ)
FROM anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.generar_codigo_pedido(TIMESTAMPTZ)
TO service_role;

REVOKE ALL
ON FUNCTION public.asignar_codigo_pedido()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.asignar_codigo_pedido()
FROM anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.asignar_codigo_pedido()
TO service_role;

REVOKE ALL
ON FUNCTION public.proteger_codigo_pedido()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.proteger_codigo_pedido()
FROM anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.proteger_codigo_pedido()
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
    'codigo_pedido', pe.codigo_pedido,
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

REVOKE ALL
ON FUNCTION public.crear_pedido(UUID, JSONB, TEXT)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.crear_pedido(UUID, JSONB, TEXT)
FROM anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.crear_pedido(UUID, JSONB, TEXT)
TO service_role;
