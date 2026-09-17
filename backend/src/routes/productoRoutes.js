import express from "express";

import {
  listarProductos,
  buscarProductoPorId,
  registrarProducto,
  editarProducto,
  borrarProducto
} from "../controllers/productoController.js";

import {
  authMiddleware
} from "../middlewares/authMiddleware.js";

import {
  requireRole,
  ROLES
} from "../middlewares/roleMiddleware.js";

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

// Eliminar un producto
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