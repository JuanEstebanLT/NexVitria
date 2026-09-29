import { randomUUID } from "node:crypto";
import supabase from "../config/supabase.js";

const PRODUCT_IMAGE_BUCKET = "product-images";

const obtenerRutaControlada = (imagenUrl, productoId) => {
  if (!imagenUrl) return null;

  const marcador = "__ruta_producto__";
  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(marcador);
  const publicUrl = data?.publicUrl;

  if (!publicUrl?.endsWith(marcador)) return null;

  const prefijo = publicUrl.slice(0, -marcador.length);

  try {
    const url = new URL(imagenUrl);
    url.search = "";
    url.hash = "";
    const urlLimpia = url.toString();

    if (!urlLimpia.startsWith(prefijo)) return null;

    const ruta = decodeURIComponent(urlLimpia.slice(prefijo.length));
    const patronRuta = new RegExp(
      `^${productoId}/principal-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png)$`,
      "i"
    );

    return patronRuta.test(ruta) ? ruta : null;
  } catch {
    return null;
  }
};

const actualizarUrlImagen = async (productoId, imagenUrl) => {
  const { data, error } = await supabase
    .from("productos")
    .update({ imagen_url: imagenUrl })
    .eq("id", productoId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const eliminarObjetoSinOcultarError = async (ruta) => {
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove([ruta]);

  if (error) {
    throw error;
  }
};

const intentarEliminarObjeto = async (ruta) => {
  try {
    await eliminarObjetoSinOcultarError(ruta);
  } catch (error) {
    console.error("No fue posible limpiar la imagen del producto:", error);
  }
};

// Obtener todos los productos
export const obtenerProductos = async () => {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      *,
      categoria:categorias!inner (
        id,
        nombre
      )
    `)
    .eq("activo", true)
    .eq("categoria.activo", true)
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
      categoria:categorias!inner (
        id,
        nombre
      )
    `)
    .eq("id", id)
    .eq("activo", true)
    .eq("categoria.activo", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Obtener un producto existente, incluso si está inactivo, para gestionar su imagen
export const obtenerProductoParaImagen = async (id) => {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
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

// Desactivar lógicamente un producto
export const eliminarProducto = async (id) => {
  const { data, error } = await supabase
    .from("productos")
    .update({ activo: false })
    .eq("id", id)
    .eq("activo", true)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Guardar una imagen pública y persistir su URL en el producto
export const guardarImagenProducto = async ({
  producto,
  buffer,
  contentType,
  extension
}) => {
  const nuevaRuta = `${producto.id}/principal-${randomUUID()}.${extension}`;
  const rutaAnterior = obtenerRutaControlada(
    producto.imagen_url,
    producto.id
  );

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(nuevaRuta, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(nuevaRuta);
  const nuevaUrl = publicUrlData?.publicUrl;

  if (!nuevaUrl) {
    await intentarEliminarObjeto(nuevaRuta);
    throw new Error("No fue posible obtener la URL pública de la imagen");
  }

  let productoActualizado;

  try {
    productoActualizado = await actualizarUrlImagen(producto.id, nuevaUrl);
  } catch (error) {
    await intentarEliminarObjeto(nuevaRuta);
    throw error;
  }

  if (rutaAnterior && rutaAnterior !== nuevaRuta) {
    try {
      await eliminarObjetoSinOcultarError(rutaAnterior);
    } catch (error) {
      let rollbackExitoso = false;

      try {
        await actualizarUrlImagen(producto.id, producto.imagen_url);
        rollbackExitoso = true;
      } catch (rollbackError) {
        console.error(
          "No fue posible revertir la URL de imagen del producto:",
          rollbackError
        );
      }

      if (rollbackExitoso) {
        await intentarEliminarObjeto(nuevaRuta);
      }

      throw error;
    }
  }

  return productoActualizado;
};

// Quitar la URL del producto y borrar el objeto si pertenece a la aplicación
export const eliminarImagenProducto = async (producto) => {
  const ruta = obtenerRutaControlada(producto.imagen_url, producto.id);
  const productoActualizado = await actualizarUrlImagen(producto.id, null);

  if (ruta) {
    try {
      await eliminarObjetoSinOcultarError(ruta);
    } catch (error) {
      try {
        await actualizarUrlImagen(producto.id, producto.imagen_url);
      } catch (rollbackError) {
        console.error(
          "No fue posible revertir la eliminación de imagen del producto:",
          rollbackError
        );
      }

      throw error;
    }
  }

  return productoActualizado;
};
