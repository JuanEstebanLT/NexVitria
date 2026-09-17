import express from "express";

import {
  listarCategorias,
  buscarCategoriaPorId,
  registrarCategoria,
  editarCategoria,
  borrarCategoria
} from "../controllers/categoriaController.js";

const router = express.Router();

// Obtener todas las categorías
router.get("/", listarCategorias);

// Obtener una categoría por ID
router.get("/:id", buscarCategoriaPorId);

// Crear una categoría
router.post("/", registrarCategoria);

// Actualizar una categoría
router.put("/:id", editarCategoria);

// Eliminar una categoría
router.delete("/:id", borrarCategoria);

export default router;