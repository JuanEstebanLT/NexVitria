import supabaseAuth from "../config/supabaseAuth.js";

// Registrar un nuevo usuario
export const registrarUsuario = async ({
  email,
  password,
  nombre,
  apellido
}) => {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido
      }
    }
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    session: data.session
  };
};

// Iniciar sesión
export const iniciarSesion = async ({
  email,
  password
}) => {
  const { data, error } =
    await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    session: data.session
  };
};