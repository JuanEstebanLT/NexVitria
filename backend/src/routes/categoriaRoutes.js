import express from "express";

import {
  listarCategorias,
  buscarCategoriaPorId,
  registrarCategoria,
  editarCategoria,
  borrarCategoria
} from "../controllers/categoriaController.js";

import {
  authMiddleware
} from "../middlewares/authMiddleware.js";

import {
  requireRole,
  ROLES
} from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Obtener todas las categorías
router.get("/", listarCategorias);

// Obtener una categoría por ID
router.get("/:id", buscarCategoriaPorId);

// Crear una categoría
router.post(
  "/",
  authMiddleware,
  requireRole(
    ROLES.EMPLEADO,
    ROLES.ADMINISTRADOR
  ),
  registrarCategoria
);

// Actualizar una categoría
router.put(
  "/:id",
  authMiddleware,
  requireRole(
    ROLES.EMPLEADO,
    ROLES.ADMINISTRADOR
  ),
  editarCategoria
);

// Eliminar una categoría
router.delete(
  "/:id",
  authMiddleware,
  requireRole(
    ROLES.ADMINISTRADOR
  ),
  borrarCategoria
);

export default router;
