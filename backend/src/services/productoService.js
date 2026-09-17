import supabase from "../config/supabase.js";

// Obtener todos los productos
export const obtenerProductos = async () => {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      *,
      categoria:categorias (
        id,
        nombre
      )
    `)
    .order("nombre", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

// Obtener un producto por su ID
export const obtenerProductoPorId = async (id) => {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      *,
      categoria:categorias (
        id,
        nombre
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Crear un nuevo producto
export const crearProducto = async (producto) => {
  const {
    categoria_id,
    nombre,
    descripcion,
    precio,
    stock,
    disponible,
    imagen_url
  } = producto;

  const { data, error } = await supabase
    .from("productos")
    .insert({
      categoria_id,
      nombre,
      descripcion,
      precio,
      stock,
      disponible,
      imagen_url
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Actualizar un producto
export const actualizarProducto = async (id, producto) => {
  const datosActualizados = {};

  if (producto.categoria_id !== undefined) {
    datosActualizados.categoria_id = producto.categoria_id;
  }

  if (producto.nombre !== undefined) {
    datosActualizados.nombre = producto.nombre;
  }

  if (producto.descripcion !== undefined) {
    datosActualizados.descripcion = producto.descripcion;
  }

  if (producto.precio !== undefined) {
    datosActualizados.precio = producto.precio;
  }

  if (producto.stock !== undefined) {
    datosActualizados.stock = producto.stock;
  }

  if (producto.disponible !== undefined) {
    datosActualizados.disponible = producto.disponible;
  }

  if (producto.imagen_url !== undefined) {
    datosActualizados.imagen_url = producto.imagen_url;
  }

  if (producto.activo !== undefined) {
    datosActualizados.activo = producto.activo;
  }

  const { data, error } = await supabase
    .from("productos")
    .update(datosActualizados)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Eliminar un producto
export const eliminarProducto = async (id) => {
  const { data, error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};