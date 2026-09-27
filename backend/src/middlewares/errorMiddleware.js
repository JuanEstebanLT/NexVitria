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
  // Registrar el error en el servidor
  console.error(err);

  const response = {
    success: false,
    message: "Error interno del servidor"
  };

  return res.status(err.status || 500).json(response);
};
