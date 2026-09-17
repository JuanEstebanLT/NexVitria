import supabaseAuth from "../config/supabaseAuth.js";
import supabase from "../config/supabase.js";

// =====================================================
// VERIFICAR USUARIO AUTENTICADO
// =====================================================

export const authMiddleware = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    // Verificar que exista el encabezado Authorization
    if (!authorizationHeader) {
      return res.status(401).json({
        success: false,
        message: "Se requiere autenticación"
      });
    }

    // El formato esperado es:
    // Authorization: Bearer TOKEN
    const partes = authorizationHeader.trim().split(/\s+/);

    if (
      partes.length !== 2 ||
      partes[0].toLowerCase() !== "bearer" ||
      !partes[1]
    ) {
      return res.status(401).json({
        success: false,
        message: "El token de autenticación no es válido"
      });
    }

    const token = partes[1];

    // Validar el JWT directamente con Supabase Auth
    const {
      data: { user },
      error: authError
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: "La sesión no es válida o ha expirado"
      });
    }

    // Obtener el perfil interno de NexVitria
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          `
          id,
          nombre,
          apellido,
          telefono,
          rol,
          activo
          `
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      return next(profileError);
    }

    // Todo usuario de NexVitria debe tener un perfil
    if (!profile) {
      return res.status(403).json({
        success: false,
        message: "El usuario no tiene un perfil válido en NexVitria"
      });
    }

    // Bloquear usuarios desactivados
    if (!profile.activo) {
      return res.status(403).json({
        success: false,
        message: "La cuenta se encuentra desactivada"
      });
    }

    // Guardar información verificada para los siguientes middlewares
    req.user = {
      id: user.id,
      email: user.email,
      nombre: profile.nombre,
      apellido: profile.apellido,
      telefono: profile.telefono,
      rol: profile.rol,
      activo: profile.activo
    };

    return next();
  } catch (error) {
    return next(error);
  }
};