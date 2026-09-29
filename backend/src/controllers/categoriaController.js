import {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from "../services/categoriaService.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOMBRE_LENGTH = 120;
const MAX_DESCRIPCION_LENGTH = 1000;
const CAMPOS_CREACION = new Set(["nombre", "descripcion"]);
const CAMPOS_ACTUALIZACION = new Set([
  "nombre",
  "descripcion",
  "activo"
]);

const esCuerpoValido = (body) =>
  body !== null && typeof body === "object" && !Array.isArray(body);

const camposNoPermitidos = (body, permitidos) =>
  Object.keys(body).filter((campo) => !permitidos.has(campo));

const descripcionNormalizada = (descripcion) => {
  if (descripcion === undefined || descripcion === null) return null;
  if (typeof descripcion !== "string") return undefined;

  const valor = descripcion.trim();
  if (valor.length > MAX_DESCRIPCION_LENGTH) return undefined;

  return valor || null;
};

const responderIdInvalido = (res) =>
  res.status(400).json({
    success: false,
    message: "El ID de la categoría no es válido"
  });

// Obtener todas las categorías activas
export const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await obtenerCategorias();

    return res.status(200).json({
      success: true,
      data: categorias
    });
  } catch (error) {
    return next(error);
  }
};

// Obtener una categoría activa por ID
export const buscarCategoriaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) return responderIdInvalido(res);

    const categoria = await obtenerCategoriaPorId(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      success: true,
      data: categoria
    });
  } catch (error) {
    return next(error);
  }
};

// Crear una nueva categoría
export const registrarCategoria = async (req, res, next) => {
  try {
    if (!esCuerpoValido(req.body)) {
      return res.status(400).json({
        success: false,
        message: "El cuerpo de la solicitud no es válido"
      });
    }

    const noPermitidos = camposNoPermitidos(req.body, CAMPOS_CREACION);
    if (noPermitidos.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos no permitidos: ${noPermitidos.join(", ")}`
      });
    }

    const { nombre, descripcion } = req.body;

    if (
      typeof nombre !== "string" ||
      !nombre.trim() ||
      nombre.trim().length > MAX_NOMBRE_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `El nombre es obligatorio y no puede superar ${MAX_NOMBRE_LENGTH} caracteres`
      });
    }

    const descripcionValidada = descripcionNormalizada(descripcion);
    if (descripcionValidada === undefined) {
      return res.status(400).json({
        success: false,
        message: `La descripción debe ser texto y no puede superar ${MAX_DESCRIPCION_LENGTH} caracteres`
      });
    }

    const nuevaCategoria = await crearCategoria({
      nombre: nombre.trim(),
      descripcion: descripcionValidada
    });

    return res.status(201).json({
      success: true,
      message: "Categoría creada correctamente",
      data: nuevaCategoria
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Ya existe una categoría con ese nombre"
      });
    }

    return next(error);
  }
};

// Actualizar una categoría
export const editarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return responderIdInvalido(res);

    if (!esCuerpoValido(req.body)) {
      return res.status(400).json({
        success: false,
        message: "El cuerpo de la solicitud no es válido"
      });
    }

    const noPermitidos = camposNoPermitidos(
      req.body,
      CAMPOS_ACTUALIZACION
    );
    if (noPermitidos.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos no permitidos: ${noPermitidos.join(", ")}`
      });
    }

    const { nombre, descripcion, activo } = req.body;
    const datosActualizados = {};

    if (nombre !== undefined) {
      if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        nombre.trim().length > MAX_NOMBRE_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message: `El nombre no puede estar vacío ni superar ${MAX_NOMBRE_LENGTH} caracteres`
        });
      }

      datosActualizados.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      const descripcionValidada = descripcionNormalizada(descripcion);
      if (descripcionValidada === undefined) {
        return res.status(400).json({
          success: false,
          message: `La descripción debe ser texto y no puede superar ${MAX_DESCRIPCION_LENGTH} caracteres`
        });
      }

      datosActualizados.descripcion = descripcionValidada;
    }

    if (activo !== undefined) {
      if (typeof activo !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "El campo activo debe ser verdadero o falso"
        });
      }

      datosActualizados.activo = activo;
    }

    if (Object.keys(datosActualizados).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe enviar al menos un campo para actualizar"
      });
    }

    const categoriaActualizada = await actualizarCategoria(
      id,
      datosActualizados
    );

    if (!categoriaActualizada) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Categoría actualizada correctamente",
      data: categoriaActualizada
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Ya existe una categoría con ese nombre"
      });
    }

    return next(error);
  }
};

// Desactivar una categoría sin borrar sus datos
export const borrarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return responderIdInvalido(res);

    const categoriaDesactivada = await eliminarCategoria(id);

    if (!categoriaDesactivada) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Categoría desactivada correctamente",
      data: categoriaDesactivada
    });
  } catch (error) {
    return next(error);
  }
};
