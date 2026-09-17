import {
  registrarUsuario,
  iniciarSesion
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

// =====================================================
// REGISTRO
// =====================================================

export const registro = async (req, res, next) => {
  try {
    const {
      email,
      password,
      nombre,
      apellido
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

    const resultado = await registrarUsuario({
      email: email.trim().toLowerCase(),
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim()
    });

    return res.status(201).json({
      success: true,
      message: resultado.session
        ? "Usuario registrado correctamente"
        : "Usuario registrado. Revise su correo electrónico para confirmar la cuenta",
      data: {
        user: resultado.user,
        session: resultado.session
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
        user: resultado.user,
        session: resultado.session
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