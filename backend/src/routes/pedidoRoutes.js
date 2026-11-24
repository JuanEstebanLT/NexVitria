import express from "express";

import {
  registrarPedido,
  listarPedidos,
  buscarPedidoPorCodigo
} from "../controllers/pedidoController.js";

import {
  authMiddleware
} from "../middlewares/authMiddleware.js";

import {
  requireRole,
  ROLES
} from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Crear un pedido para el cliente autenticado
router.post(
  "/",
  authMiddleware,
  requireRole(ROLES.CLIENTE),
  registrarPedido
);

// Obtener todos los pedidos del cliente autenticado
router.get(
  "/",
  authMiddleware,
  requireRole(ROLES.CLIENTE),
  listarPedidos
);

// Obtener un pedido del cliente autenticado por su código público
router.get(
  "/:codigo",
  authMiddleware,
  requireRole(ROLES.CLIENTE),
  buscarPedidoPorCodigo
);

export default router;
