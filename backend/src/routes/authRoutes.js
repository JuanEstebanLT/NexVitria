import express from "express";

import {
  registro,
  login,
  obtenerUsuarioActual,
  actualizarUsuarioActual,
  logout,
  subirAvatar,
  borrarAvatar
} from "../controllers/authController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { avatarUploadMiddleware } from "../middlewares/avatarUploadMiddleware.js";

import {
  loginRateLimiter,
  registroRateLimiter
} from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

// Registro de usuario
router.post(
  "/registro",
  registroRateLimiter,
  registro
);

// Inicio de sesión
router.post(
  "/login",
  loginRateLimiter,
  login
);

// Perfil validado de la sesión actual
router.get(
  "/me",
  authMiddleware,
  obtenerUsuarioActual
);

router.patch(
  "/me",
  authMiddleware,
  actualizarUsuarioActual
);

router.post(
  "/avatar",
  authMiddleware,
  avatarUploadMiddleware,
  subirAvatar
);

router.delete(
  "/avatar",
  authMiddleware,
  borrarAvatar
);

// Cerrar y revocar la sesión actual
router.post(
  "/logout",
  authMiddleware,
  logout
);

export default router;
