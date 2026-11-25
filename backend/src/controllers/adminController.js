import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerPedidosPorUsuario
} from "../services/adminService.js";
import { ROLES } from "../middlewares/roleMiddleware.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTROS_PERMITIDOS = new Set(["search", "rol", "activo"]);
const ROLES_PERMITIDOS = new Set(Object.values(ROLES));
const MAX_SEARCH_LENGTH = 100;

const validarUsuarioId = (valor) => {
  const usuarioId = typeof valor === "string"
    ? valor.trim().toLowerCase()
    : "";

  return UUID_REGEX.test(usuarioId) ? usuarioId : null;
};

const validarFiltros = (query) => {
  const noPermitidos = Object.keys(query)
    .filter((campo) => !FILTROS_PERMITIDOS.has(campo));

  if (noPermitidos.length > 0) {
    return {
      error: `Filtros no permitidos: ${noPermitidos.join(", ")}`
    };
  }

  const filtros = {};

  if (query.search !== undefined) {
    if (typeof query.search !== "string") {
      return { error: "El filtro search no es válido" };
    }

    const search = query.search.trim();
    if (search.length > MAX_SEARCH_LENGTH) {
      return {
        error: `El filtro search no puede superar ${MAX_SEARCH_LENGTH} caracteres`
      };
    }

    if (search) filtros.search = search;
  }

  if (query.rol !== undefined) {
    if (typeof query.rol !== "string") {
      return { error: "El filtro rol no es válido" };
    }

    const rol = query.rol.trim().toUpperCase();
    if (rol && !ROLES_PERMITIDOS.has(rol)) {
      return { error: "El filtro rol no es válido" };
    }

    if (rol) filtros.rol = rol;
  }

  if (query.activo !== undefined) {
    if (typeof query.activo !== "string") {
      return { error: "El filtro activo no es válido" };
    }

    const activo = query.activo.trim().toLowerCase();
    if (activo && activo !== "true" && activo !== "false") {
      return { error: "El filtro activo debe ser true o false" };
    }

    if (activo) filtros.activo = activo === "true";
  }

  return { filtros };
};

export const listarUsuarios = async (req, res, next) => {
  try {
    const validacion = validarFiltros(req.query);

    if (validacion.error) {
      return res.status(400).json({
        success: false,
        message: validacion.error
      });
    }

    const usuarios = await obtenerUsuarios(validacion.filtros);

    return res.status(200).json({
      success: true,
      data: usuarios,
      meta: {
        total: usuarios.length
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const buscarUsuarioPorId = async (req, res, next) => {
  try {
    const usuarioId = validarUsuarioId(req.params.id);

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        message: "El id del usuario no es válido"
      });
    }

    const usuario = await obtenerUsuarioPorId(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    return next(error);
  }
};

export const listarPedidosDeUsuario = async (req, res, next) => {
  try {
    const usuarioId = validarUsuarioId(req.params.id);

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        message: "El id del usuario no es válido"
      });
    }

    const pedidos = await obtenerPedidosPorUsuario(usuarioId);

    if (!pedidos) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    return next(error);
  }
};
