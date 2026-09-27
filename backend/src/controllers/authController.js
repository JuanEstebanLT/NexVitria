import {
  registrarUsuario,
  iniciarSesion,
  cerrarSesion,
  actualizarDatosPersonales,
  crearUrlFirmadaAvatar,
  eliminarAvatar,
  guardarAvatar
} from "../services/authService.js";

// Validar formato básico de correo electrónico
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Política de contraseña:
// - mínimo 8 caracteres
// - al menos una mayúscula
// - al menos una minúscula
// - al menos un número
// - al menos un carácter especial
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const phoneCharactersRegex = /^\+?[\d\s().-]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 32;

const normalizarTelefono = (telefono) => {
  if (telefono === undefined || telefono === null) {
    return null;
  }

  if (typeof telefono !== "string") {
    return undefined;
  }

  const telefonoNormalizado = telefono.trim();

  if (!telefonoNormalizado) {
    return null;
  }

  if (telefonoNormalizado.length > MAX_PHONE_LENGTH) {
    return undefined;
  }

  const cantidadDigitos = telefonoNormalizado.replace(/\D/g, "").length;

  if (
    !phoneCharactersRegex.test(telefonoNormalizado) ||
    cantidadDigitos < 7 ||
    cantidadDigitos > 15
  ) {
    return undefined;
  }

  return telefonoNormalizado;
};

const normalizarNombre = (valor) => {
  if (typeof valor !== "string") return undefined;

  const valorNormalizado = valor.trim();

  if (!valorNormalizado || valorNormalizado.length > MAX_NAME_LENGTH) {
    return undefined;
  }

  return valorNormalizado;
};

// =====================================================
// REGISTRO
// =====================================================

export const registro = async (req, res, next) => {
  try {
    const {
      email,
      password,
      nombre,
      apellido,
      telefono
    } = req.body;

    const telefonoNormalizado = normalizarTelefono(telefono);

    // Validar correo
    if (
      !email ||
      typeof email !== "string" ||
      !emailRegex.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Debe ingresar un correo electrónico válido"
      });
    }

    // Validar contraseña
    if (
      !password ||
      typeof password !== "string" ||
      !passwordRegex.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial"
      });
    }

    // Validar nombre
    if (
      !nombre ||
      typeof nombre !== "string" ||
      nombre.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "El nombre es obligatorio"
      });
    }

    // Validar apellido
    if (
      !apellido ||
      typeof apellido !== "string" ||
      apellido.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "El apellido es obligatorio"
      });
    }

    if (telefonoNormalizado === undefined) {
      return res.status(400).json({
        success: false,
        message: "Debe ingresar un teléfono válido de entre 7 y 15 dígitos"
      });
    }

    const resultado = await registrarUsuario({
      email: email.trim().toLowerCase(),
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefonoNormalizado
    });

    return res.status(201).json({
      success: true,
      message: resultado.session
        ? "Usuario registrado correctamente"
        : "Usuario registrado. Revise su correo electrónico para confirmar la cuenta",
      data: {
        requires_email_confirmation: !resultado.session,
        access_token: resultado.session?.access_token || null,
        expires_at: resultado.session?.expires_at || null,
        expires_in: resultado.session?.expires_in || null
      }
    });
  } catch (error) {
    const mensajeError =
      error.message?.toLowerCase() || "";

    // Correo rechazado por Supabase
    if (
      mensajeError.includes("email address") &&
      mensajeError.includes("invalid")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La dirección de correo electrónico no es válida"
      });
    }

    // Usuario ya registrado
    if (
      mensajeError.includes("already registered") ||
      mensajeError.includes("user already registered")
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Ya existe un usuario registrado con ese correo electrónico"
      });
    }

    // Contraseña rechazada por Supabase
    if (mensajeError.includes("password")) {
      return res.status(400).json({
        success: false,
        message:
          "La contraseña no cumple los requisitos de seguridad"
      });
    }

    return next(error);
  }
};

// =====================================================
// INICIO DE SESIÓN
// =====================================================

export const login = async (req, res, next) => {
  try {
    const {
      email,
      password
    } = req.body;

    // Validar correo
    if (
      !email ||
      typeof email !== "string" ||
      !emailRegex.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Debe ingresar un correo electrónico válido"
      });
    }

    // Validar que se haya enviado una contraseña
    if (
      !password ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La contraseña es obligatoria"
      });
    }

    const resultado = await iniciarSesion({
      email: email.trim().toLowerCase(),
      password
    });

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión realizado correctamente",
      data: {
        access_token: resultado.session.access_token,
        expires_at: resultado.session.expires_at,
        expires_in: resultado.session.expires_in
      }
    });
  } catch (error) {
    const mensajeError =
      error.message?.toLowerCase() || "";

    if (
      mensajeError.includes("invalid login credentials")
    ) {
      return res.status(401).json({
        success: false,
        message: "Correo electrónico o contraseña incorrectos"
      });
    }

    if (
      mensajeError.includes("email not confirmed")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Debe confirmar su correo electrónico antes de iniciar sesión"
      });
    }

    return next(error);
  }
};

// =====================================================
// USUARIO AUTENTICADO
// =====================================================

export const obtenerUsuarioActual = async (req, res, next) => {
  try {
    const {
      id,
      email,
      nombre,
      apellido,
      telefono,
      rol,
      activo,
      avatar_path
    } = req.user;

    const avatar_url = await crearUrlFirmadaAvatar(avatar_path);

    return res.status(200).json({
      success: true,
      data: {
        id,
        email,
        nombre,
        apellido,
        telefono,
        rol,
        activo,
        avatar_path,
        avatar_url
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const actualizarUsuarioActual = async (req, res, next) => {
  try {
    const nombre = normalizarNombre(req.body?.nombre);
    const apellido = normalizarNombre(req.body?.apellido);
    const telefono = normalizarTelefono(req.body?.telefono);

    if (nombre === undefined) {
      return res.status(400).json({
        success: false,
        message: `El nombre es obligatorio y no puede superar ${MAX_NAME_LENGTH} caracteres.`
      });
    }

    if (apellido === undefined) {
      return res.status(400).json({
        success: false,
        message: `El apellido es obligatorio y no puede superar ${MAX_NAME_LENGTH} caracteres.`
      });
    }

    if (telefono === undefined) {
      return res.status(400).json({
        success: false,
        message: "Debe ingresar un teléfono válido de entre 7 y 15 dígitos."
      });
    }

    const profile = await actualizarDatosPersonales({
      userId: req.user.id,
      nombre,
      apellido,
      telefono
    });
    const avatar_url = await crearUrlFirmadaAvatar(profile.avatar_path);

    return res.status(200).json({
      success: true,
      message: "Datos personales actualizados correctamente.",
      data: {
        id: profile.id,
        email: req.user.email,
        nombre: profile.nombre,
        apellido: profile.apellido,
        telefono: profile.telefono,
        rol: profile.rol,
        activo: profile.activo,
        avatar_path: profile.avatar_path,
        avatar_url
      }
    });
  } catch (error) {
    return next(error);
  }
};

const detectarTipoAvatar = (file) => {
  if (!file?.buffer || file.buffer.length < 8) return null;

  const esJpeg =
    file.mimetype === "image/jpeg" &&
    file.buffer[0] === 0xff &&
    file.buffer[1] === 0xd8 &&
    file.buffer[2] === 0xff;

  const firmaPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const esPng =
    file.mimetype === "image/png" &&
    firmaPng.every((byte, index) => file.buffer[index] === byte);

  if (esJpeg) return "image/jpeg";
  if (esPng) return "image/png";
  return null;
};

export const subirAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Debes seleccionar una imagen JPG, JPEG o PNG."
      });
    }

    const contentType = detectarTipoAvatar(req.file);

    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: "Solo puedes subir imágenes JPG, JPEG o PNG válidas."
      });
    }

    const avatar = await guardarAvatar({
      userId: req.user.id,
      buffer: req.file.buffer,
      contentType
    });

    return res.status(200).json({
      success: true,
      message: "Foto de perfil actualizada correctamente.",
      data: avatar
    });
  } catch (error) {
    return next(error);
  }
};

export const borrarAvatar = async (req, res, next) => {
  try {
    await eliminarAvatar({
      userId: req.user.id,
      avatarPath: req.user.avatar_path
    });

    return res.status(200).json({
      success: true,
      message: "Foto de perfil eliminada correctamente.",
      data: {
        avatar_path: null,
        avatar_url: null
      }
    });
  } catch (error) {
    return next(error);
  }
};

// =====================================================
// CIERRE DE SESIÓN
// =====================================================

export const logout = async (req, res, next) => {
  try {
    await cerrarSesion(req.accessToken);

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente"
    });
  } catch (error) {
    return next(error);
  }
};
