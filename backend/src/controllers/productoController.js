import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from "../services/productoService.js";

// Obtener todos los productos
export const listarProductos = async (req, res, next) => {
  try {
    const productos = await obtenerProductos();

    return res.status(200).json({
      success: true,
      data: productos
    });
  } catch (error) {
    return next(error);
  }
};

// Obtener un producto por ID
export const buscarProductoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const producto = await obtenerProductoPorId(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: producto
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "El ID del producto no es válido"
      });
    }

    return next(error);
  }
};

// Crear un nuevo producto
export const registrarProducto = async (req, res, next) => {
  try {
    const {
      categoria_id,
      nombre,
      descripcion,
      precio,
      stock,
      disponible,
      imagen_url
    } = req.body;

    // Validar categoría
    if (
      !categoria_id ||
      typeof categoria_id !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La categoría del producto es obligatoria"
      });
    }

    // Validar nombre
    if (
      !nombre ||
      typeof nombre !== "string" ||
      nombre.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "El nombre del producto es obligatorio"
      });
    }

    // Validar descripción
    if (
      descripcion !== undefined &&
      descripcion !== null &&
      typeof descripcion !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La descripción debe ser texto"
      });
    }

    // Validar precio
    if (
      precio === undefined ||
      precio === null ||
      typeof precio !== "number" ||
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "El precio debe ser un número mayor que 0"
      });
    }

    // Validar stock
    if (
      stock !== undefined &&
      (!Number.isInteger(stock) || stock < 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "El stock debe ser un número entero mayor o igual a 0"
      });
    }

    // Validar disponibilidad
    if (
      disponible !== undefined &&
      typeof disponible !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "El campo disponible debe ser verdadero o falso"
      });
    }

    // Validar URL de imagen
    if (
      imagen_url !== undefined &&
      imagen_url !== null &&
      typeof imagen_url !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La URL de la imagen debe ser texto"
      });
    }

    const nuevoProducto = await crearProducto({
      categoria_id,
      nombre: nombre.trim(),
      descripcion:
        typeof descripcion === "string"
          ? descripcion.trim()
          : null,
      precio,
      stock: stock ?? 0,
      disponible: disponible ?? true,
      imagen_url:
        typeof imagen_url === "string"
          ? imagen_url.trim()
          : null
    });

    return res.status(201).json({
      success: true,
      message: "Producto creado correctamente",
      data: nuevoProducto
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "La categoría especificada no existe"
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message:
          "Los datos del producto no cumplen las restricciones"
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

// Actualizar un producto
export const editarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      categoria_id,
      nombre,
      descripcion,
      precio,
      stock,
      disponible,
      imagen_url,
      activo
    } = req.body;

    const datosActualizados = {};

    // Validar categoría
    if (categoria_id !== undefined) {
      if (
        !categoria_id ||
        typeof categoria_id !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "La categoría no puede estar vacía"
        });
      }

      datosActualizados.categoria_id = categoria_id;
    }

    // Validar nombre
    if (nombre !== undefined) {
      if (
        typeof nombre !== "string" ||
        nombre.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "El nombre del producto no puede estar vacío"
        });
      }

      datosActualizados.nombre = nombre.trim();
    }

    // Validar descripción
    if (descripcion !== undefined) {
      if (
        descripcion !== null &&
        typeof descripcion !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "La descripción debe ser texto"
        });
      }

      datosActualizados.descripcion =
        typeof descripcion === "string"
          ? descripcion.trim()
          : null;
    }

    // Validar precio
    if (precio !== undefined) {
      if (
        typeof precio !== "number" ||
        !Number.isFinite(precio) ||
        precio <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "El precio debe ser un número mayor que 0"
        });
      }

      datosActualizados.precio = precio;
    }

    // Validar stock
    if (stock !== undefined) {
      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          message:
            "El stock debe ser un número entero mayor o igual a 0"
        });
      }

      datosActualizados.stock = stock;
    }

    // Validar disponibilidad
    if (disponible !== undefined) {
      if (typeof disponible !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "El campo disponible debe ser verdadero o falso"
        });
      }

      datosActualizados.disponible = disponible;
    }

    // Validar URL de imagen
    if (imagen_url !== undefined) {
      if (
        imagen_url !== null &&
        typeof imagen_url !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "La URL de la imagen debe ser texto"
        });
      }

      datosActualizados.imagen_url =
        typeof imagen_url === "string"
          ? imagen_url.trim()
          : null;
    }

    // Validar estado activo
    if (activo !== undefined) {
      if (typeof activo !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "El campo activo debe ser verdadero o falso"
        });
      }

      datosActualizados.activo = activo;
    }

    // Comprobar que exista algo para actualizar
    if (Object.keys(datosActualizados).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe enviar al menos un campo para actualizar"
      });
    }

    const productoActualizado = await actualizarProducto(
      id,
      datosActualizados
    );

    if (!productoActualizado) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Producto actualizado correctamente",
      data: productoActualizado
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "La categoría especificada no existe"
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message:
          "Los datos del producto no cumplen las restricciones"
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "El ID especificado no es válido"
      });
    }

    return next(error);
  }
};

// Eliminar un producto
export const borrarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const productoEliminado = await eliminarProducto(id);

    if (!productoEliminado) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Producto eliminado correctamente",
      data: productoEliminado
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "El ID del producto no es válido"
      });
    }

    return next(error);
  }
};