import supabaseAuth from "../config/supabaseAuth.js";
import supabase from "../config/supabase.js";

const AVATAR_BUCKET = "avatars";

// Registrar un nuevo usuario
export const registrarUsuario = async ({
  email,
  password,
  nombre,
  apellido,
  telefono
}) => {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido,
        telefono
      }
    }
  });

  if (error) {
    throw error;
  }

  if (!data.user?.id) {
    throw new Error("Supabase no devolvió el usuario registrado");
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
    session: data.session
  };
};

// Cerrar la sesión validada y revocarla globalmente en Supabase.
// El access token se recibe únicamente desde authMiddleware.
export const cerrarSesion = async (accessToken) => {
  const { error } = await supabase.auth.admin.signOut(
    accessToken,
    "global"
  );

  if (error) {
    throw error;
  }
};

export const crearUrlFirmadaAvatar = async (avatarPath) => {
  if (!avatarPath) return null;

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(avatarPath, 60 * 60);

  if (error) {
    console.error("No fue posible crear la URL firmada del avatar:", error);
    return null;
  }

  return data?.signedUrl || null;
};

export const actualizarDatosPersonales = async ({
  userId,
  nombre,
  apellido,
  telefono
}) => {
  const datosPermitidos = {
    nombre,
    apellido,
    telefono
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(datosPermitidos)
    .eq("id", userId)
    .select(
      `
      id,
      nombre,
      apellido,
      telefono,
      rol,
      activo,
      avatar_path
      `
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const guardarAvatar = async ({ userId, buffer, contentType }) => {
  const avatarPath = `${userId}/avatar`;
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(avatarPath, buffer, {
      contentType,
      cacheControl: "60",
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  return {
    avatar_path: avatarPath,
    avatar_url: await crearUrlFirmadaAvatar(avatarPath)
  };
};

export const eliminarAvatar = async ({ userId, avatarPath }) => {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  if (avatarPath) {
    const { error: storageError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([avatarPath]);

    if (storageError) {
      console.error("No fue posible eliminar el objeto de avatar:", storageError);
    }
  }
};
