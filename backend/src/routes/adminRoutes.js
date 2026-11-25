import express from "express";

import {
  listarUsuarios,
  buscarUsuarioPorId,
  listarPedidosDeUsuario
} from "../controllers/adminController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  requireRole,
  ROLES
} from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(
  authMiddleware,
  requireRole(ROLES.ADMINISTRADOR)
);

router.get("/usuarios", listarUsuarios);
router.get("/usuarios/:id/pedidos", listarPedidosDeUsuario);
router.get("/usuarios/:id", buscarUsuarioPorId);

export default router;
