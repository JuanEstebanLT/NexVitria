import express from "express";

import {
  registro,
  login
} from "../controllers/authController.js";

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

export default router;