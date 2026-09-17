import supabase from "../config/supabase.js";

// Obtener todas las categorías
export const obtenerCategorias = async () => {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

// Obtener una categoría por su ID
export const obtenerCategoriaPorId = async (id) => {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Crear una nueva categoría
export const crearCategoria = async (categoria) => {
  const { nombre, descripcion } = categoria;

  const { data, error } = await supabase
    .from("categorias")
    .insert({
      nombre,
      descripcion
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Actualizar una categoría existente
export const actualizarCategoria = async (id, categoria) => {
  const datosActualizados = {};

  if (categoria.nombre !== undefined) {
    datosActualizados.nombre = categoria.nombre;
  }

  if (categoria.descripcion !== undefined) {
    datosActualizados.descripcion = categoria.descripcion;
  }

  if (categoria.activo !== undefined) {
    datosActualizados.activo = categoria.activo;
  }

  const { data, error } = await supabase
    .from("categorias")
    .update(datosActualizados)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Eliminar una categoría
export const eliminarCategoria = async (id) => {
  const { data, error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};