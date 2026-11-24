import {
  crearPedido as crearPedidoService,
  obtenerPedidosPorCliente,
  obtenerPedidoPorCodigoYCliente
} from "../services/pedidoService.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODIGO_PEDIDO_REGEX = /^NV-\d{8}-[A-F0-9]{12}$/;
const MAX_OBSERVACIONES_LENGTH = 500;
const CAMPOS_PEDIDO = new Set(["items", "observaciones"]);
const CAMPOS_ITEM = new Set(["producto_id", "cantidad"]);

const esObjeto = (valor) =>
  valor !== null && typeof valor === "object" && !Array.isArray(valor);

const camposNoPermitidos = (objeto, permitidos) =>
  Object.keys(objeto).filter((campo) => !permitidos.has(campo));

const validarItems = (items) => {
  if (items === undefined) {
    return {
      error: "Los items del pedido son obligatorios"
    };
  }

  if (!Array.isArray(items)) {
    return {
      error: "Los items del pedido deben ser un arreglo"
    };
  }

  if (items.length === 0) {
    return {
      error: "El pedido debe contener al menos un item"
    };
  }

  const productosIncluidos = new Set();
  const itemsNormalizados = [];

  for (let indice = 0; indice < items.length; indice += 1) {
    const item = items[indice];
    const numeroItem = indice + 1;

    if (!esObjeto(item)) {
      return {
        error: `El item ${numeroItem} debe ser un objeto`
      };
    }

    const noPermitidos = camposNoPermitidos(item, CAMPOS_ITEM);
    if (noPermitidos.length > 0) {
      return {
        error: `Campos no permitidos en el item ${numeroItem}: ${noPermitidos.join(", ")}`
      };
    }

    if (item.producto_id === undefined) {
      return {
        error: `El producto_id del item ${numeroItem} es obligatorio`
      };
    }

    const productoId =
      typeof item.producto_id === "string"
        ? item.producto_id.trim().toLowerCase()
        : "";

    if (!UUID_REGEX.test(productoId)) {
      return {
        error: `El producto_id del item ${numeroItem} no es válido`
      };
    }

    if (item.cantidad === undefined) {
      return {
        error: `La cantidad del item ${numeroItem} es obligatoria`
      };
    }

    if (!Number.isInteger(item.cantidad)) {
      return {
        error: `La cantidad del item ${numeroItem} debe ser un número entero`
      };
    }

    if (item.cantidad < 1 || item.cantidad > 10) {
      return {
        error: `La cantidad del item ${numeroItem} debe estar entre 1 y 10`
      };
    }

    if (productosIncluidos.has(productoId)) {
      return {
        error: `El producto del item ${numeroItem} está duplicado`
      };
    }

    productosIncluidos.add(productoId);
    itemsNormalizados.push({
      producto_id: productoId,
      cantidad: item.cantidad
    });
  }

  return {
    items: itemsNormalizados
  };
};

const normalizarObservaciones = (observaciones) => {
  if (observaciones === undefined) {
    return {
      observaciones: null
    };
  }

  if (typeof observaciones !== "string") {
    return {
      error: "Las observaciones deben ser texto"
    };
  }

  const valor = observaciones.trim();

  if (valor.length > MAX_OBSERVACIONES_LENGTH) {
    return {
      error: `Las observaciones no pueden superar ${MAX_OBSERVACIONES_LENGTH} caracteres`
    };
  }

  return {
    observaciones: valor || null
  };
};

const responderErrorCreacion = (error, res, next) => {
  const mensaje = error.message?.toLowerCase() || "";

  if (mensaje.includes("perfil del cliente está inactivo")) {
    return res.status(403).json({
      success: false,
      message: "La cuenta se encuentra desactivada"
    });
  }

  if (
    mensaje.includes("perfil del cliente no existe") ||
    mensaje.includes("no tiene rol cliente")
  ) {
    return res.status(403).json({
      success: false,
      message: "No tiene permisos para generar el pedido"
    });
  }

  if (mensaje.includes("stock insuficiente")) {
    return res.status(409).json({
      success: false,
      message: "Stock insuficiente para uno o más productos"
    });
  }

  if (
    mensaje.includes("producto") &&
    (
      mensaje.includes("no está disponible") ||
      mensaje.includes("está inactivo") ||
      mensaje.includes("no existen") ||
      mensaje.includes("no fue posible descontar")
    )
  ) {
    return res.status(409).json({
      success: false,
      message: "Uno o más productos no están disponibles"
    });
  }

  if (
    mensaje.includes("categoría") &&
    (
      mensaje.includes("no existe") ||
      mensaje.includes("está inactiva")
    )
  ) {
    return res.status(409).json({
      success: false,
      message: "La categoría de uno o más productos no está disponible"
    });
  }

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "El pedido contiene productos duplicados"
    });
  }

  if (
    error.code === "22023" ||
    error.code === "23503" ||
    error.code === "23514" ||
    error.code === "22003"
  ) {
    return res.status(400).json({
      success: false,
      message: "Los datos del pedido no son válidos"
    });
  }

  return next(error);
};

// Crear un pedido para el cliente autenticado
export const registrarPedido = async (req, res, next) => {
  try {
    if (!esObjeto(req.body)) {
      return res.status(400).json({
        success: false,
        message: "El cuerpo de la solicitud no es válido"
      });
    }

    const noPermitidos = camposNoPermitidos(req.body, CAMPOS_PEDIDO);
    if (noPermitidos.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos no permitidos: ${noPermitidos.join(", ")}`
      });
    }

    const validacionItems = validarItems(req.body.items);
    if (validacionItems.error) {
      return res.status(400).json({
        success: false,
        message: validacionItems.error
      });
    }

    const validacionObservaciones = normalizarObservaciones(
      req.body.observaciones
    );
    if (validacionObservaciones.error) {
      return res.status(400).json({
        success: false,
        message: validacionObservaciones.error
      });
    }

    const pedido = await crearPedidoService({
      clienteId: req.user.id,
      items: validacionItems.items,
      observaciones: validacionObservaciones.observaciones
    });

    return res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      data: pedido
    });
  } catch (error) {
    return responderErrorCreacion(error, res, next);
  }
};

// Obtener todos los pedidos del cliente autenticado
export const listarPedidos = async (req, res, next) => {
  try {
    const pedidos = await obtenerPedidosPorCliente(req.user.id);

    return res.status(200).json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    return next(error);
  }
};

// Obtener un pedido del cliente autenticado por su código público
export const buscarPedidoPorCodigo = async (req, res, next) => {
  try {
    const codigoPedido =
      typeof req.params.codigo === "string"
        ? req.params.codigo.trim().toUpperCase()
        : "";

    if (!CODIGO_PEDIDO_REGEX.test(codigoPedido)) {
      return res.status(400).json({
        success: false,
        message: "El código del pedido no es válido"
      });
    }

    const pedido = await obtenerPedidoPorCodigoYCliente({
      codigoPedido,
      clienteId: req.user.id
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: pedido
    });
  } catch (error) {
    return next(error);
  }
};
