import {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from "../services/categoriaService.js";

// Obtener todas las categorías
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

// Obtener una categoría por ID
export const buscarCategoriaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

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
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "El ID de la categoría no es válido"
      });
    }

    return next(error);
  }
};

// Crear una nueva categoría
export const registrarCategoria = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;

    if (
      !nombre ||
      typeof nombre !== "string" ||
      nombre.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la categoría es obligatorio"
      });
    }

    const nuevaCategoria = await crearCategoria({
      nombre: nombre.trim(),
      descripcion: descripcion ?? null
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
    const { nombre, descripcion, activo } = req.body;

    const datosActualizados = {};

    if (nombre !== undefined) {
      if (
        typeof nombre !== "string" ||
        nombre.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "El nombre de la categoría no puede estar vacío"
        });
      }

      datosActualizados.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      datosActualizados.descripcion = descripcion;
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

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "El ID de la categoría no es válido"
      });
    }

    return next(error);
  }
};

// Eliminar una categoría
export const borrarCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;

    const categoriaEliminada = await eliminarCategoria(id);

    if (!categoriaEliminada) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Categoría eliminada correctamente",
      data: categoriaEliminada
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "No se puede eliminar la categoría porque tiene productos asociados"
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "El ID de la categoría no es válido"
      });
    }

    return next(error);
  }
};