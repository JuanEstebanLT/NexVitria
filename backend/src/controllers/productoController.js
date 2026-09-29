import {
  obtenerProductos,
  obtenerProductoPorId,
  obtenerProductoParaImagen,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  guardarImagenProducto,
  eliminarImagenProducto
} from "../services/productoService.js";
import { obtenerCategoriaPorId } from "../services/categoriaService.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOMBRE_LENGTH = 200;
const MAX_DESCRIPCION_LENGTH = 5000;
const MAX_PRECIO = 9_999_999_999.99;
const MAX_STOCK = 2_147_483_647;
const CAMPOS_CREACION = new Set([
  "categoria_id",
  "nombre",
  "descripcion",
  "precio",
  "stock",
  "disponible"
]);
const CAMPOS_ACTUALIZACION = new Set([
  ...CAMPOS_CREACION,
  "activo"
]);

const esCuerpoValido = (body) =>
  body !== null && typeof body === "object" && !Array.isArray(body);

const camposNoPermitidos = (body, permitidos) =>
  Object.keys(body).filter((campo) => !permitidos.has(campo));

const normalizarTextoOpcional = (valor, longitudMaxima) => {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== "string") return undefined;

  const texto = valor.trim();
  if (texto.length > longitudMaxima) return undefined;

  return texto || null;
};

const precioValido = (precio) => {
  if (
    typeof precio !== "number" ||
    !Number.isFinite(precio) ||
    precio <= 0 ||
    precio > MAX_PRECIO
  ) {
    return false;
  }

  const centavos = Math.round(precio * 100);
  const tolerancia = Number.EPSILON * Math.max(1, Math.abs(precio)) * 4;
  return Math.abs(precio - centavos / 100) <= tolerancia;
};

const stockValido = (stock) =>
  Number.isInteger(stock) && stock >= 0 && stock <= MAX_STOCK;

const responderIdInvalido = (res, recurso = "producto") =>
  res.status(400).json({
    success: false,
    message: `El ID del ${recurso} no es válido`
  });

const categoriaActivaExiste = async (categoriaId) => {
  const categoria = await obtenerCategoriaPorId(categoriaId);
  return Boolean(categoria);
};

const detectarTipoImagenProducto = (file) => {
  if (!file?.buffer || file.buffer.length < 8) return null;

  const esJpeg =
    file.mimetype === "image/jpeg" &&
    file.buffer[0] === 0xff &&
    file.buffer[1] === 0xd8 &&
    file.buffer[2] === 0xff;

  const firmaPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const esPng =
    file.mimetype === "image/png" &&
    firmaPng.every((byte, index) => file.buffer[index] === byte);

  if (esJpeg) {
    return {
      contentType: "image/jpeg",
      extension: "jpg"
    };
  }

  if (esPng) {
    return {
      contentType: "image/png",
      extension: "png"
    };
  }

  return null;
};

// Obtener todos los productos activos de categorías activas
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

// Obtener un producto activo por ID
export const buscarProductoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return responderIdInvalido(res);

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
    return next(error);
  }
};

// Subir o reemplazar la imagen persistente de un producto
export const subirImagenProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return responderIdInvalido(res);

    const producto = await obtenerProductoParaImagen(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Debes seleccionar una imagen JPG, JPEG o PNG."
      });
    }

    const tipoImagen = detectarTipoImagenProducto(req.file);

    if (!tipoImagen) {
      return res.status(400).json({
        success: false,
        message: "El archivo no contiene una imagen JPG, JPEG o PNG válida."
      });
    }

    const productoActualizado = await guardarImagenProducto({
      producto,
      buffer: req.file.buffer,
      contentType: tipoImagen.contentType,
      extension: tipoImagen.extension
    });

    return res.status(200).json({
      success: true,
      message: producto.imagen_url
        ? "Imagen del producto reemplazada correctamente."
        : "Imagen del producto subida correctamente.",
      data: productoActualizado
    });
  } catch (error) {
    return next(error);
  }
};

// Eliminar la imagen persistente de un producto
export const borrarImagenProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return responderIdInvalido(res);

    const producto = await obtenerProductoParaImagen(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    if (!producto.imagen_url) {
      return res.status(200).json({
        success: true,
        message: "El producto no tiene una imagen para eliminar.",
        data: producto
      });
    }

    const productoActualizado = await eliminarImagenProducto(producto);

    return res.status(200).json({
      success: true,
      message: "Imagen del producto eliminada correctamente.",
      data: productoActualizado
    });
  } catch (error) {
    return next(error);
  }
};

// Crear un nuevo producto
export const registrarProducto = async (req, res, next) => {
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

    const {
      categoria_id,
      nombre,
      descripcion,
      precio,
      stock,
      disponible
    } = req.body;
    const categoriaId =
      typeof categoria_id === "string" ? categoria_id.trim() : "";

    if (!UUID_REGEX.test(categoriaId)) {
      return responderIdInvalido(res, "categoría");
    }

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

    const descripcionValidada = normalizarTextoOpcional(
      descripcion,
      MAX_DESCRIPCION_LENGTH
    );
    if (descripcionValidada === undefined) {
      return res.status(400).json({
        success: false,
        message: `La descripción debe ser texto y no puede superar ${MAX_DESCRIPCION_LENGTH} caracteres`
      });
    }

    if (!precioValido(precio)) {
      return res.status(400).json({
        success: false,
        message: `El precio debe ser un número mayor que 0, con máximo 2 decimales y no superar ${MAX_PRECIO}`
      });
    }

    if (stock !== undefined && !stockValido(stock)) {
      return res.status(400).json({
        success: false,
        message: `El stock debe ser un entero entre 0 y ${MAX_STOCK}`
      });
    }

    if (disponible !== undefined && typeof disponible !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "El campo disponible debe ser verdadero o falso"
      });
    }

    if (!(await categoriaActivaExiste(categoriaId))) {
      return res.status(400).json({
        success: false,
        message: "La categoría especificada no existe o está inactiva"
      });
    }

    const nuevoProducto = await crearProducto({
      categoria_id: categoriaId,
      nombre: nombre.trim(),
      descripcion: descripcionValidada,
      precio,
      stock: stock ?? 0,
      disponible: disponible ?? true
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

    if (error.code === "23514" || error.code === "22003") {
      return res.status(400).json({
        success: false,
        message: "Los datos del producto no cumplen las restricciones"
      });
    }

    return next(error);
  }
};

// Actualizar un producto
export const editarProducto = async (req, res, next) => {
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

    const {
      categoria_id,
      nombre,
      descripcion,
      precio,
      stock,
      disponible,
      activo
    } = req.body;
    const datosActualizados = {};

    if (categoria_id !== undefined) {
      const categoriaId =
        typeof categoria_id === "string" ? categoria_id.trim() : "";

      if (!UUID_REGEX.test(categoriaId)) {
        return responderIdInvalido(res, "categoría");
      }

      if (!(await categoriaActivaExiste(categoriaId))) {
        return res.status(400).json({
          success: false,
          message: "La categoría especificada no existe o está inactiva"
        });
      }

      datosActualizados.categoria_id = categoriaId;
    }

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
      const descripcionValidada = normalizarTextoOpcional(
        descripcion,
        MAX_DESCRIPCION_LENGTH
      );
      if (descripcionValidada === undefined) {
        return res.status(400).json({
          success: false,
          message: `La descripción debe ser texto y no puede superar ${MAX_DESCRIPCION_LENGTH} caracteres`
        });
      }

      datosActualizados.descripcion = descripcionValidada;
    }

    if (precio !== undefined) {
      if (!precioValido(precio)) {
        return res.status(400).json({
          success: false,
          message: `El precio debe ser un número mayor que 0, con máximo 2 decimales y no superar ${MAX_PRECIO}`
        });
      }

      datosActualizados.precio = precio;
    }

    if (stock !== undefined) {
      if (!stockValido(stock)) {
        return res.status(400).json({
          success: false,
          message: `El stock debe ser un entero entre 0 y ${MAX_STOCK}`
        });
      }

      datosActualizados.stock = stock;
    }

    if (disponible !== undefined) {
      if (typeof disponible !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "El campo disponible debe ser verdadero o falso"
        });
      }

      datosActualizados.disponible = disponible;
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

    if (error.code === "23514" || error.code === "22003") {
      return res.status(400).json({
        success: false,
        message: "Los datos del producto no cumplen las restricciones"
      });
    }

    return next(error);
  }
};

// Desactivar un producto sin borrar sus datos
export const borrarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) return responderIdInvalido(res);

    const productoDesactivado = await eliminarProducto(id);

    if (!productoDesactivado) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Producto desactivado correctamente",
      data: productoDesactivado
    });
  } catch (error) {
    return next(error);
  }
};
