// =====================================================
// MIDDLEWARE PARA RUTAS NO ENCONTRADAS
// =====================================================

export const notFoundMiddleware = (req, res) => {
  return res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
};

// =====================================================
// MIDDLEWARE GLOBAL DE ERRORES
// =====================================================

export const errorMiddleware = (err, req, res, next) => {
  const isDevelopment =
    process.env.NODE_ENV === "development";

  // Registrar el error en el servidor
  console.error(err);

  const response = {
    success: false,
    message: "Error interno del servidor"
  };

  // Mostrar detalles solamente durante desarrollo
  if (isDevelopment) {
    response.error = err.message;
    response.stack = err.stack;
  }

  return res.status(err.status || 500).json(response);
};