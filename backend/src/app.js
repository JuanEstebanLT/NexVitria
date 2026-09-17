import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";

import {
  notFoundMiddleware,
  errorMiddleware
} from "./middlewares/errorMiddleware.js";

const app = express();

// =====================================================
// CONFIGURACIÓN DE SEGURIDAD
// =====================================================

// Ocultar información sobre la tecnología utilizada
app.disable("x-powered-by");

// Agregar encabezados HTTP de seguridad
app.use(helmet());

// Orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173"
];

// Configuración de CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin Origin
      // como Postman, curl o comunicación entre servidores
      if (!origin) {
        return callback(null, true);
      }

      // Permitir únicamente los orígenes autorizados
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

// Limitar el tamaño máximo de los cuerpos JSON
app.use(
  express.json({
    limit: "10kb"
  })
);

// =====================================================
// RUTA INICIAL
// =====================================================

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "API de NexVitria funcionando correctamente"
  });
});

// =====================================================
// RUTAS
// =====================================================

// Autenticación
app.use("/api/auth", authRoutes);

// Categorías
app.use("/api/categorias", categoriaRoutes);

// Productos
app.use("/api/productos", productoRoutes);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;