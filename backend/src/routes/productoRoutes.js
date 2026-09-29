import express from "express";

import {
  listarProductos,
  buscarProductoPorId,
  registrarProducto,
  editarProducto,
  borrarProducto,
  subirImagenProducto,
  borrarImagenProducto
} from "../controllers/productoController.js";

import {
  authMiddleware
} from "../middlewares/authMiddleware.js";

import {
  requireRole,
  ROLES
} from "../middlewares/roleMiddleware.js";
import { productImageUploadMiddleware } from "../middlewares/productImageUploadMiddleware.js";

const router = express.Router();

// =====================================================
// RUTAS PÚBLICAS
// =====================================================

// Obtener todos los productos
router.get("/", listarProductos);

// Obtener un producto por ID
router.get("/:id", buscarProductoPorId);

// =====================================================
// RUTAS PROTEGIDAS
// =====================================================

// Subir o reemplazar la imagen de un producto
// Permitido: EMPLEADO y ADMINISTRADOR
router.post(
  "/:id/imagen",
  authMiddleware,
  requireRole(
    ROLES.EMPLEADO,
    ROLES.ADMINISTRADOR
  ),
  productImageUploadMiddleware,
  subirImagenProducto
);

// Eliminar la imagen de un producto
// Permitido: EMPLEADO y ADMINISTRADOR
router.delete(
  "/:id/imagen",
  authMiddleware,
  requireRole(
    ROLES.EMPLEADO,
    ROLES.ADMINISTRADOR
  ),
  borrarImagenProducto
);

// Crear un producto
// Permitido: EMPLEADO y ADMINISTRADOR
router.post(
  "/",
  authMiddleware,
  requireRole(
    ROLES.EMPLEADO,
    ROLES.ADMINISTRADOR
  ),
  registrarProducto
);

// Actualizar un producto
// Permitido: EMPLEADO y ADMINISTRADOR
router.put(
  "/:id",
  authMiddleware,
  requireRole(
    ROLES.EMPLEADO,
    ROLES.ADMINISTRADOR
  ),
  editarProducto
);

router.patch(
  "/:id",
  authMiddleware,
  requireRole(
    ROLES.EMPLEADO,
    ROLES.ADMINISTRADOR
  ),
  editarProducto
);

// Desactivar un producto
// Permitido: solo ADMINISTRADOR
router.delete(
  "/:id",
  authMiddleware,
  requireRole(
    ROLES.ADMINISTRADOR
  ),
  borrarProducto
);

export default router;
