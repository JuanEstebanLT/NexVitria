import { open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import supabase from "../src/config/supabase.js";
import {
  actualizarProducto,
  crearProducto,
  guardarImagenProducto
} from "../src/services/productoService.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const INITIAL_STOCK = 20;
const PNG_SIGNATURE = Buffer.from([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a
]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PRODUCT_IMAGE_DIRECTORY = path.resolve(
  SCRIPT_DIRECTORY,
  "../../frontend/src/assets/images/products"
);

// Fuente administrativa transcrita de frontend/src/data/products.js.
// badge, featured, stockVisual y presentation son datos visuales del mock;
// no se escriben porque public.productos no tiene columnas equivalentes.
const CATALOG = [
  {
    id: "shampoo-natural",
    name: "Shampoo Natural",
    legacyNames: ["Shampoo natural"],
    category: "Cuidado capilar",
    description: "Limpieza suave con romero y aloe vera para acompañar el cuidado diario del cabello.",
    price: 32900,
    imageFile: "01_shampoo_natural.png",
    badge: "Destacado",
    featured: true,
    stockVisual: "Disponible",
    presentation: "300 ml"
  },
  {
    id: "acondicionador-nutritivo",
    name: "Acondicionador Nutritivo",
    category: "Cuidado capilar",
    description: "Fórmula nutritiva que ayuda a suavizar y desenredar el cabello después del lavado.",
    price: 34900,
    imageFile: "02_acondicionador_nutritivo.png",
    badge: "Nutrición",
    featured: false,
    stockVisual: "Disponible",
    presentation: "300 ml"
  },
  {
    id: "aceite-corporal-hidratante",
    name: "Aceite Corporal Hidratante",
    category: "Cuidado corporal",
    description: "Textura ligera para nutrir la piel y completar tu rutina después del baño.",
    price: 28900,
    imageFile: "03_aceite_corporal_hidratante.png",
    badge: "Bienestar",
    featured: true,
    stockVisual: "Disponible",
    presentation: "120 ml"
  },
  {
    id: "crema-hidratante-corporal",
    name: "Crema Hidratante Corporal",
    category: "Cuidado corporal",
    description: "Hidratación cotidiana con una textura delicada y una presentación práctica.",
    price: 36900,
    imageFile: "04_crema_hidratante_corporal.png",
    badge: "Cuidado diario",
    featured: true,
    stockVisual: "Disponible",
    presentation: "250 g"
  },
  {
    id: "jabon-artesanal",
    name: "Jabón Artesanal",
    category: "Higiene personal",
    description: "Un esencial de limpieza elaborado para una rutina sencilla y consciente.",
    price: 14900,
    imageFile: "05_jabon_artesanal.png",
    badge: "Artesanal",
    featured: true,
    stockVisual: "Disponible",
    presentation: "100 g"
  },
  {
    id: "balsamo-labial-natural",
    name: "Bálsamo Labial Natural",
    category: "Bienestar",
    description: "Cuidado suave que ayuda a proteger y mantener la hidratación de los labios.",
    price: 16900,
    imageFile: "06_balsamo_labial_natural.png",
    badge: null,
    featured: false,
    stockVisual: "Disponible",
    presentation: "15 g"
  },
  {
    id: "gel-limpiador-facial",
    name: "Gel Limpiador Facial",
    category: "Cuidado facial",
    description: "Limpieza fresca para retirar impurezas sin descuidar el equilibrio de la piel.",
    price: 29900,
    imageFile: "07_gel_limpiador_facial.png",
    badge: "Rutina facial",
    featured: false,
    stockVisual: "Disponible",
    presentation: "200 ml"
  },
  {
    id: "bruma-relajante",
    name: "Bruma Relajante",
    category: "Bienestar",
    description: "Una bruma ligera para crear momentos de calma y frescura durante el día.",
    price: 24900,
    imageFile: "08_bruma_relajante.png",
    badge: "Momento de calma",
    featured: false,
    stockVisual: "Disponible",
    presentation: "120 ml"
  },
  {
    id: "exfoliante-corporal",
    name: "Exfoliante Corporal",
    category: "Cuidado corporal",
    description: "Exfoliación corporal para una piel de apariencia suave y renovada.",
    price: 31900,
    imageFile: "09_exfoliante_corporal.png",
    badge: null,
    featured: false,
    stockVisual: "Disponible",
    presentation: "250 g"
  },
  {
    id: "desodorante-natural",
    name: "Desodorante Natural",
    category: "Higiene personal",
    description: "Protección diaria con una fórmula pensada para brindar frescura y comodidad.",
    price: 21900,
    imageFile: "10_desodorante_natural.png",
    badge: "Uso diario",
    featured: false,
    stockVisual: "Disponible",
    presentation: "60 g"
  },
  {
    id: "mascarilla-capilar-reparadora",
    name: "Mascarilla Capilar Reparadora",
    category: "Cuidado capilar",
    description: "Tratamiento intensivo para nutrir el cabello y mejorar su apariencia.",
    price: 42900,
    imageFile: "11_mascarilla_capilar_reparadora.png",
    badge: "Tratamiento",
    featured: false,
    stockVisual: "Disponible",
    presentation: "250 g"
  },
  {
    id: "tonico-facial-equilibrante",
    name: "Tónico Facial Equilibrante",
    category: "Cuidado facial",
    description: "Paso refrescante que prepara la piel para continuar la rutina facial.",
    price: 27900,
    imageFile: "12_tonico_facial_equilibrante.png",
    badge: null,
    featured: false,
    stockVisual: "Disponible",
    presentation: "200 ml"
  },
  {
    id: "crema-de-manos",
    name: "Crema de Manos",
    category: "Cuidado corporal",
    description: "Hidratación práctica para conservar las manos suaves en cualquier momento.",
    price: 18900,
    imageFile: "13_crema_de_manos.png",
    badge: null,
    featured: false,
    stockVisual: "Disponible",
    presentation: "75 ml"
  },
  {
    id: "body-mist-energizante",
    name: "Body Mist Energizante",
    category: "Bienestar",
    description: "Aroma corporal ligero y fresco para acompañar tus rutinas cotidianas.",
    price: 26900,
    imageFile: "14_body_mist_energizante.png",
    badge: "Energizante",
    featured: false,
    stockVisual: "Disponible",
    presentation: "150 ml"
  },
  {
    id: "shampoo-anticaspa",
    name: "Shampoo Anticaspa",
    category: "Cuidado capilar",
    description: "Limpieza específica para mantener una sensación de frescura en el cuero cabelludo.",
    price: 35900,
    imageFile: "15_shampoo_anticaspa.png",
    badge: null,
    featured: false,
    stockVisual: "Disponible",
    presentation: "300 ml"
  },
  {
    id: "agua-micelar",
    name: "Agua Micelar",
    category: "Cuidado facial",
    description: "Limpieza suave para retirar maquillaje e impurezas con una sensación ligera.",
    price: 28900,
    imageFile: "16_agua_micelar.png",
    badge: "Limpieza suave",
    featured: false,
    stockVisual: "Disponible",
    presentation: "250 ml"
  },
  {
    id: "crema-facial-nocturna",
    name: "Crema Facial Nocturna",
    category: "Cuidado facial",
    description: "Cuidado hidratante para acompañar la recuperación natural de la piel durante la noche.",
    price: 42900,
    imageFile: "17_crema_facial_nocturna.png",
    badge: "Rutina nocturna",
    featured: false,
    stockVisual: "Disponible",
    presentation: "50 g"
  }
];

const CATEGORY_NAMES = [
  "Cuidado capilar",
  "Cuidado corporal",
  "Cuidado facial",
  "Higiene personal",
  "Bienestar"
];

const formatError = (error) =>
  error instanceof Error ? error.message : String(error);

const createSummary = () => ({
  expectedProducts: CATALOG.length,
  existingProducts: 0,
  createdProducts: 0,
  updatedProducts: 0,
  synchronizedImages: 0,
  createdCategories: 0,
  updatedCategories: 0,
  errors: []
});

const addError = (summary, message) => {
  summary.errors.push(message);
  console.error(`✗ ${message}`);
};

const validateImage = async (product) => {
  const imagePath = path.join(PRODUCT_IMAGE_DIRECTORY, product.imageFile);

  let imageStat;

  try {
    imageStat = await stat(imagePath);
  } catch (error) {
    return {
      valid: false,
      imagePath,
      reason: `archivo inexistente o inaccesible (${formatError(error)})`
    };
  }

  if (!imageStat.isFile()) {
    return {
      valid: false,
      imagePath,
      reason: "la ruta no corresponde a un archivo"
    };
  }

  if (imageStat.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      imagePath,
      reason: "el archivo supera los 5 MB"
    };
  }

  if (imageStat.size < JPEG_SIGNATURE.length) {
    return {
      valid: false,
      imagePath,
      reason: "el archivo es demasiado pequeño para ser una imagen válida"
    };
  }

  const fileHandle = await open(imagePath, "r");

  try {
    const signature = Buffer.alloc(PNG_SIGNATURE.length);
    const { bytesRead } = await fileHandle.read(
      signature,
      0,
      signature.length,
      0
    );
    const isPng =
      bytesRead >= PNG_SIGNATURE.length && signature.equals(PNG_SIGNATURE);
    const isJpeg =
      bytesRead >= JPEG_SIGNATURE.length &&
      signature.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE);

    if (isPng) {
      return {
        valid: true,
        imagePath,
        size: imageStat.size,
        format: "PNG",
        contentType: "image/png",
        extension: "png"
      };
    }

    if (isJpeg) {
      return {
        valid: true,
        imagePath,
        size: imageStat.size,
        format: "JPEG",
        contentType: "image/jpeg",
        extension: "jpg"
      };
    }

    return {
      valid: false,
      imagePath,
      reason: "la firma real del archivo no corresponde a PNG ni JPEG"
    };
  } finally {
    await fileHandle.close();
  }
};

const validateImages = async (summary) => {
  const validations = new Map();
  let validImages = 0;
  let pngImages = 0;
  let jpegImages = 0;
  let imageErrors = 0;

  console.log("\nValidación de imágenes:");

  for (const product of CATALOG) {
    try {
      const validation = await validateImage(product);
      validations.set(product.name, validation);

      if (validation.valid) {
        validImages += 1;

        if (validation.format === "PNG") {
          pngImages += 1;
          console.log(`✓ ${product.imageFile} — PNG válido`);
        } else {
          jpegImages += 1;
          console.log(
            `✓ ${product.imageFile} — JPEG válido detectado por firma`
          );
        }
      } else {
        imageErrors += 1;
        addError(
          summary,
          `${product.name}: ${product.imageFile} — ${validation.reason}`
        );
      }
    } catch (error) {
      const validation = {
        valid: false,
        imagePath: path.join(PRODUCT_IMAGE_DIRECTORY, product.imageFile),
        reason: formatError(error)
      };
      validations.set(product.name, validation);
      imageErrors += 1;
      addError(
        summary,
        `${product.name}: no fue posible validar ${product.imageFile} (${validation.reason})`
      );
    }
  }

  console.log("\nResumen de validación de imágenes:");
  console.log(`Imágenes válidas: ${validImages}`);
  console.log(`PNG reales: ${pngImages}`);
  console.log(`JPEG reales: ${jpegImages}`);
  console.log(`Errores de imagen: ${imageErrors}`);

  return validations;
};

const findCategoryByExactName = async (name) => {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("nombre", name);

  if (error) throw error;
  return data || [];
};

const synchronizeCategories = async ({ dryRun, summary }) => {
  const categories = new Map();

  console.log("\nCategorías:");

  for (const name of CATEGORY_NAMES) {
    try {
      const matches = await findCategoryByExactName(name);

      if (matches.length > 1) {
        addError(
          summary,
          `Categoría ${name}: existen ${matches.length} registros con el mismo nombre exacto`
        );
        continue;
      }

      if (matches.length === 1) {
        let category = matches[0];

        if (!category.activo) {
          if (dryRun) {
            summary.updatedCategories += 1;
            console.log(`• ${name} — se reactivaría`);
            category = { ...category, activo: true };
          } else {
            const { data, error } = await supabase
              .from("categorias")
              .update({ activo: true })
              .eq("id", category.id)
              .select()
              .single();

            if (error) throw error;
            category = data;
            summary.updatedCategories += 1;
            console.log(`✓ ${name} — reactivada`);
          }
        } else {
          console.log(`✓ ${name} — existente`);
        }

        categories.set(name, category);
        continue;
      }

      if (dryRun) {
        summary.createdCategories += 1;
        categories.set(name, {
          id: null,
          nombre: name,
          activo: true,
          pendingCreation: true
        });
        console.log(`• ${name} — se crearía`);
        continue;
      }

      const { data, error } = await supabase
        .from("categorias")
        .insert({
          nombre: name,
          activo: true
        })
        .select()
        .single();

      if (error) throw error;

      categories.set(name, data);
      summary.createdCategories += 1;
      console.log(`✓ ${name} — creada`);
    } catch (error) {
      addError(
        summary,
        `Categoría ${name}: ${formatError(error)}`
      );
    }
  }

  return categories;
};

const findProductByControlledNames = async (product) => {
  const controlledNames = [product.name, ...(product.legacyNames || [])];
  let query = supabase.from("productos").select("*");

  query = controlledNames.length === 1
    ? query.eq("nombre", controlledNames[0])
    : query.in("nombre", controlledNames);

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

const buildProductChanges = ({ product, existingProduct, category }) => {
  const changes = {};
  const changedFields = [];

  if (existingProduct.nombre !== product.name) {
    changes.nombre = product.name;
    changedFields.push("nombre");
  }

  if (category.pendingCreation || existingProduct.categoria_id !== category.id) {
    changes.categoria_id = category.id;
    changedFields.push("categoria_id");
  }

  if (existingProduct.descripcion !== product.description) {
    changes.descripcion = product.description;
    changedFields.push("descripcion");
  }

  if (Number(existingProduct.precio) !== product.price) {
    changes.precio = product.price;
    changedFields.push("precio");
  }

  if (existingProduct.disponible !== true) {
    changes.disponible = true;
    changedFields.push("disponible");
  }

  if (existingProduct.activo !== true) {
    changes.activo = true;
    changedFields.push("activo");
  }

  return { changes, changedFields };
};

const synchronizeProduct = async ({
  product,
  category,
  imageValidation,
  dryRun,
  summary
}) => {
  if (!category) {
    addError(
      summary,
      `${product.name}: no se pudo resolver la categoría ${product.category}`
    );
    return;
  }

  let matches;

  try {
    matches = await findProductByControlledNames(product);
  } catch (error) {
    addError(
      summary,
      `${product.name}: no fue posible consultar el producto (${formatError(error)})`
    );
    return;
  }

  if (matches.length > 1) {
    addError(
      summary,
      `${product.name}: conflicto, se encontraron ${matches.length} productos con los nombres controlados`
    );
    return;
  }

  let synchronizedProduct;
  let productAction;

  if (matches.length === 0) {
    productAction = dryRun ? "se crearía" : "creado";

    if (dryRun) {
      synchronizedProduct = {
        id: null,
        categoria_id: category.id,
        nombre: product.name,
        descripcion: product.description,
        precio: product.price,
        stock: INITIAL_STOCK,
        disponible: true,
        activo: true,
        imagen_url: null
      };
      summary.createdProducts += 1;
    } else {
      if (!category.id) {
        addError(
          summary,
          `${product.name}: la categoría ${product.category} no tiene un ID válido`
        );
        return;
      }

      try {
        synchronizedProduct = await crearProducto({
          categoria_id: category.id,
          nombre: product.name,
          descripcion: product.description,
          precio: product.price,
          stock: INITIAL_STOCK,
          disponible: true
        });
        summary.createdProducts += 1;
      } catch (error) {
        addError(
          summary,
          `${product.name}: no fue posible crear el producto (${formatError(error)})`
        );
        return;
      }
    }
  } else {
    const existingProduct = matches[0];
    const { changes, changedFields } = buildProductChanges({
      product,
      existingProduct,
      category
    });

    summary.existingProducts += 1;

    if (changedFields.length === 0) {
      synchronizedProduct = existingProduct;
      productAction = "existente sin cambios";
    } else if (dryRun) {
      synchronizedProduct = {
        ...existingProduct,
        ...changes,
        categoria_id: category.id || existingProduct.categoria_id
      };
      productAction = `se actualizaría (${changedFields.join(", ")})`;
      summary.updatedProducts += 1;
    } else {
      try {
        synchronizedProduct = await actualizarProducto(
          existingProduct.id,
          changes
        );
        productAction = `actualizado (${changedFields.join(", ")})`;
        summary.updatedProducts += 1;
      } catch (error) {
        addError(
          summary,
          `${product.name}: no fue posible actualizar el producto (${formatError(error)})`
        );
        return;
      }
    }
  }

  if (!imageValidation?.valid) {
    console.log(`• ${product.name} — ${productAction} — imagen omitida`);
    return;
  }

  const replacesImage = Boolean(synchronizedProduct.imagen_url);

  if (dryRun) {
    const imageAction = replacesImage
      ? "se reemplazaría la imagen"
      : "se subiría la imagen";
    summary.synchronizedImages += 1;
    console.log(`• ${product.name} — ${productAction} — ${imageAction}`);
    return;
  }

  try {
    const buffer = await readFile(imageValidation.imagePath);
    await guardarImagenProducto({
      producto: synchronizedProduct,
      buffer,
      contentType: imageValidation.contentType,
      extension: imageValidation.extension
    });
    summary.synchronizedImages += 1;
    console.log(
      `✓ ${product.name} — ${productAction} — imagen ${replacesImage ? "reemplazada" : "subida"}`
    );
  } catch (error) {
    addError(
      summary,
      `${product.name}: el producto quedó sincronizado, pero falló la imagen (${formatError(error)})`
    );
  }
};

const printSummary = ({ dryRun, summary }) => {
  const prefix = dryRun ? "Plan del dry-run" : "Resultado";

  console.log(`\n${prefix}:`);
  console.log(`Productos esperados: ${summary.expectedProducts}`);
  console.log(`Productos existentes reutilizados: ${summary.existingProducts}`);
  console.log(
    `Productos ${dryRun ? "por crear" : "creados"}: ${summary.createdProducts}`
  );
  console.log(
    `Productos ${dryRun ? "por actualizar" : "actualizados"}: ${summary.updatedProducts}`
  );
  console.log(
    `Imágenes ${dryRun ? "por subir/reemplazar" : "subidas/reemplazadas"}: ${summary.synchronizedImages}`
  );
  console.log(
    `Categorías ${dryRun ? "por crear" : "creadas"}: ${summary.createdCategories}`
  );
  console.log(
    `Categorías ${dryRun ? "por actualizar" : "actualizadas"}: ${summary.updatedCategories}`
  );
  console.log(`Errores: ${summary.errors.length}`);
};

const run = async () => {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter((arg) => arg !== "--dry-run");

  if (unknownArgs.length > 0) {
    throw new Error(`Argumentos no reconocidos: ${unknownArgs.join(", ")}`);
  }

  const dryRun = args.includes("--dry-run");
  const summary = createSummary();

  console.log("Sincronización del catálogo inicial de NexVitria");
  console.log(`Modo: ${dryRun ? "DRY RUN (sin escrituras)" : "REAL"}`);
  console.log(`Productos en la fuente: ${CATALOG.length}`);
  console.log(`Directorio de imágenes: ${PRODUCT_IMAGE_DIRECTORY}`);

  const imageValidations = await validateImages(summary);
  const categories = await synchronizeCategories({ dryRun, summary });

  console.log("\nProductos:");

  for (const product of CATALOG) {
    await synchronizeProduct({
      product,
      category: categories.get(product.category),
      imageValidation: imageValidations.get(product.name),
      dryRun,
      summary
    });
  }

  printSummary({ dryRun, summary });

  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
};

try {
  await run();
} catch (error) {
  console.error(`\nError fatal: ${formatError(error)}`);
  process.exitCode = 1;
}
