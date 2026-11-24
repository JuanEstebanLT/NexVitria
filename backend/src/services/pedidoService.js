import supabase from "../config/supabase.js";

const CAMPOS_PEDIDO = `
  id,
  codigo_pedido,
  cliente_id,
  estado,
  subtotal,
  total,
  observaciones,
  created_at,
  updated_at,
  detalles:pedido_detalles (
    id,
    producto_id,
    nombre_producto,
    precio_unitario,
    cantidad,
    subtotal,
    created_at
  )
`;

// Crear un pedido mediante la frontera transaccional de PostgreSQL
export const crearPedido = async ({
  clienteId,
  items,
  observaciones
}) => {
  const { data, error } = await supabase.rpc("crear_pedido", {
    p_cliente_id: clienteId,
    p_items: items,
    p_observaciones: observaciones
  });

  if (error) {
    throw error;
  }

  return data;
};

// Obtener los pedidos pertenecientes al cliente autenticado
export const obtenerPedidosPorCliente = async (clienteId) => {
  const { data, error } = await supabase
    .from("pedidos")
    .select(CAMPOS_PEDIDO)
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

// Obtener un pedido por su código público solo si pertenece al cliente autenticado
export const obtenerPedidoPorCodigoYCliente = async ({
  codigoPedido,
  clienteId
}) => {
  const { data, error } = await supabase
    .from("pedidos")
    .select(CAMPOS_PEDIDO)
    .eq("codigo_pedido", codigoPedido)
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};
