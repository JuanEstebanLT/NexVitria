import { rateLimit } from "express-rate-limit";

// =====================================================
// RATE LIMIT PARA INICIO DE SESIÓN
// =====================================================

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 5,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    success: false,
    message:
      "Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos"
  }
});

// =====================================================
// RATE LIMIT PARA REGISTRO DE USUARIOS
// =====================================================

export const registroRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,

  limit: 5,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Se alcanzó el límite de registros permitidos. Intente nuevamente más tarde"
  }
});