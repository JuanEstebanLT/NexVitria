// =====================================================
// ROLES DISPONIBLES EN NEXVITRIA
// =====================================================

export const ROLES = {
  CLIENTE: "CLIENTE",
  EMPLEADO: "EMPLEADO",
  ADMINISTRADOR: "ADMINISTRADOR"
};

// =====================================================
// VERIFICAR ROLES AUTORIZADOS
// =====================================================

export const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    // authMiddleware debe ejecutarse antes
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Se requiere autenticación"
      });
    }

    const rolUsuario = req.user.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para realizar esta operación"
      });
    }

    return next();
  };
};