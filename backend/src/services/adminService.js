import supabase from "../config/supabase.js";
import { obtenerPedidosPorCliente } from "./pedidoService.js";

const PAGE_SIZE = 1000;
const MAX_PAGES = 100;
const CAMPOS_PERFIL = `
  id,
  nombre,
  apellido,
  telefono,
  rol,
  activo,
  created_at
`;

const normalizarTextoBusqueda = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const mapearUsuario = (perfil, usuarioAuth) => ({
  id: perfil.id,
  email: usuarioAuth?.email || null,
  nombre: perfil.nombre,
  apellido: perfil.apellido,
  telefono: perfil.telefono,
  rol: perfil.rol,
  activo: perfil.activo,
  created_at: perfil.created_at
});

const listarUsuariosAuth = async () => {
  const usuarios = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE
    });

    if (error) {
      throw error;
    }

    const pagina = Array.isArray(data?.users) ? data.users : [];
    usuarios.push(...pagina);

    if (pagina.length < PAGE_SIZE) {
      return usuarios;
    }
  }

  throw new Error("La cantidad de usuarios supera el límite administrativo configurado");
};

const listarPerfiles = async () => {
  const perfiles = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const desde = page * PAGE_SIZE;
    const hasta = desde + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("profiles")
      .select(CAMPOS_PERFIL)
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    if (error) {
      throw error;
    }

    const pagina = Array.isArray(data) ? data : [];
    perfiles.push(...pagina);

    if (pagina.length < PAGE_SIZE) {
      return perfiles;
    }
  }

  throw new Error("La cantidad de perfiles supera el límite administrativo configurado");
};

export const obtenerUsuarios = async ({ search, rol, activo }) => {
  const [perfiles, usuariosAuth] = await Promise.all([
    listarPerfiles(),
    listarUsuariosAuth()
  ]);
  const usuariosAuthPorId = new Map(
    usuariosAuth.map((usuario) => [usuario.id, usuario])
  );
  const termino = normalizarTextoBusqueda(search);

  return perfiles
    .map((perfil) => mapearUsuario(perfil, usuariosAuthPorId.get(perfil.id)))
    .filter((usuario) => {
      if (rol && usuario.rol !== rol) return false;
      if (typeof activo === "boolean" && usuario.activo !== activo) return false;
      if (!termino) return true;

      const textoUsuario = normalizarTextoBusqueda([
        usuario.nombre,
        usuario.apellido,
        usuario.email
      ].join(" "));

      return textoUsuario.includes(termino);
    });
};

export const obtenerUsuarioPorId = async (usuarioId) => {
  const { data: perfil, error: perfilError } = await supabase
    .from("profiles")
    .select(CAMPOS_PERFIL)
    .eq("id", usuarioId)
    .maybeSingle();

  if (perfilError) {
    throw perfilError;
  }

  if (!perfil) {
    return null;
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.getUserById(usuarioId);

  if (authError) {
    if (authError.status === 404) return null;
    throw authError;
  }

  if (!authData?.user) {
    return null;
  }

  return mapearUsuario(perfil, authData.user);
};

export const obtenerPedidosPorUsuario = async (usuarioId) => {
  const { data: perfil, error: perfilError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", usuarioId)
    .maybeSingle();

  if (perfilError) {
    throw perfilError;
  }

  if (!perfil) {
    return null;
  }

  return obtenerPedidosPorCliente(usuarioId);
};
