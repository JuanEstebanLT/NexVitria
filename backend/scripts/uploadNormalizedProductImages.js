import { open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import supabase from "../src/config/supabase.js";
import { guardarImagenProducto } from "../src/services/productoService.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const EXPECTED_IMAGE_WIDTH = 1254;
const EXPECTED_IMAGE_HEIGHT = 1254;
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
const PNG_HEADER_SIZE = 24;
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const NORMALIZED_IMAGE_DIRECTORY = path.resolve(
  SCRIPT_DIRECTORY,
  "../../frontend/src/assets/images/products-normalized"
);

const PRODUCT_IMAGES = [
  {
    name: "Shampoo Natural",
    imageFile: "01_shampoo_natural_normalized.png"
  },
  {
    name: "Acondicionador Nutritivo",
    imageFile: "02_acondicionador_nutritivo_normalized.png"
  },
  {
    name: "Aceite Corporal Hidratante",
    imageFile: "03_aceite_corporal_hidratante_normalized.png"
  },
  {
    name: "Crema Hidratante Corporal",
    imageFile: "04_crema_hidratante_corporal_normalized.png"
  },
  {
    name: "Jabón Artesanal",
    imageFile: "05_jabon_artesanal_normalized.png"
  },
  {
    name: "Bálsamo Labial Natural",
    imageFile: "06_balsamo_labial_natural_normalized.png"
  },
  {
    name: "Gel Limpiador Facial",
    imageFile: "07_gel_limpiador_facial_normalized.png"
  },
  {
    name: "Bruma Relajante",
    imageFile: "08_bruma_relajante_normalized.png"
  },
  {
    name: "Exfoliante Corporal",
    imageFile: "09_exfoliante_corporal_normalized.png"
  },
  {
    name: "Desodorante Natural",
    imageFile: "10_desodorante_natural_normalized.png"
  },
  {
    name: "Mascarilla Capilar Reparadora",
    imageFile: "11_mascarilla_capilar_reparadora_normalized.png"
  },
  {
    name: "Tónico Facial Equilibrante",
    imageFile: "12_tonico_facial_equilibrante_normalized.png"
  },
  {
    name: "Crema de Manos",
    imageFile: "13_crema_de_manos_normalized.png"
  },
  {
    name: "Body Mist Energizante",
    imageFile: "14_body_mist_energizante_normalized.png"
  },
  {
    name: "Shampoo Anticaspa",
    imageFile: "15_shampoo_anticaspa_normalized.png"
  },
  {
    name: "Agua Micelar",
    imageFile: "16_agua_micelar_normalized.png"
  },
  {
    name: "Crema Facial Nocturna",
    imageFile: "17_crema_facial_nocturna_normalized.png"
  }
];

const formatError = (error) =>
  error instanceof Error ? error.message : String(error);

const createSummary = () => ({
  expectedProducts: PRODUCT_IMAGES.length,
  foundProducts: 0,
  validImages: 0,
  imagesToReplace: 0,
  replacedImages: 0,
  conflicts: 0,
  errors: []
});

const addError = (summary, message) => {
  summary.errors.push(message);
  console.error(`✗ ${message}`);
};

const validateMapping = () => {
  const productNames = new Set(PRODUCT_IMAGES.map(({ name }) => name));
  const imageFiles = new Set(PRODUCT_IMAGES.map(({ imageFile }) => imageFile));

  if (productNames.size !== PRODUCT_IMAGES.length) {
    throw new Error("El mapeo contiene nombres de producto duplicados");
  }

  if (imageFiles.size !== PRODUCT_IMAGES.length) {
    throw new Error("El mapeo contiene nombres de archivo duplicados");
  }
};

const validateImage = async (imageFile) => {
  if (path.extname(imageFile).toLowerCase() !== ".png") {
    throw new Error("el archivo no tiene extensión .png");
  }

  const imagePath = path.resolve(NORMALIZED_IMAGE_DIRECTORY, imageFile);
  const expectedPath = path.join(NORMALIZED_IMAGE_DIRECTORY, imageFile);

  if (imagePath !== expectedPath) {
    throw new Error("la ruta del archivo sale del directorio controlado");
  }

  const imageStat = await stat(imagePath);

  if (!imageStat.isFile()) {
    throw new Error("la ruta no corresponde a un archivo regular");
  }

  if (imageStat.size === 0) {
    throw new Error("el archivo está vacío");
  }

  if (imageStat.size > MAX_IMAGE_SIZE) {
    throw new Error("el archivo supera los 5 MB");
  }

  if (imageStat.size < PNG_HEADER_SIZE) {
    throw new Error("el archivo es demasiado pequeño para ser un PNG válido");
  }

  const fileHandle = await open(imagePath, "r");

  try {
    const header = Buffer.alloc(PNG_HEADER_SIZE);
    const { bytesRead } = await fileHandle.read(
      header,
      0,
      header.length,
      0
    );

    if (bytesRead < PNG_HEADER_SIZE) {
      throw new Error("no fue posible leer la cabecera PNG completa");
    }

    if (!header.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      throw new Error("la firma real del archivo no corresponde a PNG");
    }

    if (header.subarray(12, 16).toString("ascii") !== "IHDR") {
      throw new Error("el archivo PNG no contiene una cabecera IHDR válida");
    }

    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);

    if (width !== EXPECTED_IMAGE_WIDTH || height !== EXPECTED_IMAGE_HEIGHT) {
      throw new Error(
        `las dimensiones son ${width} × ${height}; se esperaban 1254 × 1254`
      );
    }

    return {
      imagePath,
      size: imageStat.size,
      width,
      height
    };
  } finally {
    await fileHandle.close();
  }
};

const findProductByExactName = async (name) => {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("nombre", name);

  if (error) {
    throw error;
  }

  return data || [];
};

const preflight = async (summary) => {
  const readyItems = [];

  console.log("\nPrevalidación:");

  for (const item of PRODUCT_IMAGES) {
    let imageValidation;
    let matches;

    try {
      imageValidation = await validateImage(item.imageFile);
      summary.validImages += 1;
    } catch (error) {
      addError(
        summary,
        `${item.name}: imagen inválida (${formatError(error)})`
      );
    }

    try {
      matches = await findProductByExactName(item.name);
    } catch (error) {
      addError(
        summary,
        `${item.name}: no fue posible consultar el producto (${formatError(error)})`
      );
      continue;
    }

    if (matches.length === 0) {
      addError(summary, `${item.name}: no existe un producto con ese nombre exacto`);
      continue;
    }

    if (matches.length > 1) {
      summary.conflicts += 1;
      addError(
        summary,
        `${item.name}: conflicto, se encontraron ${matches.length} coincidencias exactas`
      );
      continue;
    }

    summary.foundProducts += 1;

    if (!imageValidation) {
      continue;
    }

    const product = matches[0];
    readyItems.push({ ...item, imageValidation, product });
    summary.imagesToReplace += 1;

    console.log(`✓ ${item.name}`);
    console.log(
      `  imagen actual: ${product.imagen_url || "sin imagen asignada"}`
    );
    console.log(
      `  → se reemplazaría por ${item.imageFile} (${imageValidation.width} × ${imageValidation.height}, ${imageValidation.size} bytes)`
    );
  }

  return readyItems;
};

const replaceImages = async ({ items, summary }) => {
  console.log("\nReemplazo de imágenes:");

  for (const item of items) {
    try {
      const buffer = await readFile(item.imageValidation.imagePath);

      await guardarImagenProducto({
        producto: item.product,
        buffer,
        contentType: "image/png",
        extension: "png"
      });

      summary.replacedImages += 1;
      console.log(`✓ ${item.name} — imagen reemplazada`);
    } catch (error) {
      addError(
        summary,
        `${item.name}: no fue posible reemplazar la imagen (${formatError(error)})`
      );
    }
  }
};

const printSummary = ({ dryRun, summary }) => {
  console.log(`\nResumen${dryRun ? " del dry-run" : ""}:`);
  console.log(`Productos esperados: ${summary.expectedProducts}`);
  console.log(`Productos encontrados: ${summary.foundProducts}`);
  console.log(`Imágenes válidas: ${summary.validImages}`);
  console.log(`Imágenes por reemplazar: ${summary.imagesToReplace}`);
  console.log(`Conflictos: ${summary.conflicts}`);

  if (!dryRun) {
    console.log(`Imágenes reemplazadas: ${summary.replacedImages}`);
  }

  console.log(`Errores: ${summary.errors.length}`);
};

const run = async () => {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter((arg) => arg !== "--dry-run");

  if (unknownArgs.length > 0) {
    throw new Error(`Argumentos no reconocidos: ${unknownArgs.join(", ")}`);
  }

  validateMapping();

  const dryRun = args.includes("--dry-run");
  const summary = createSummary();

  console.log("Reemplazo de imágenes normalizadas de NexVitria");
  console.log(`Modo: ${dryRun ? "DRY RUN (sin escrituras)" : "REAL"}`);
  console.log(`Directorio: ${NORMALIZED_IMAGE_DIRECTORY}`);

  const readyItems = await preflight(summary);
  const preflightSucceeded =
    summary.errors.length === 0 &&
    readyItems.length === PRODUCT_IMAGES.length;

  if (!preflightSucceeded) {
    console.error(
      "\nLa prevalidación falló. No se realizará ningún reemplazo."
    );
  } else if (dryRun) {
    console.log("\nDry-run completado: no se modificó Supabase ni Storage.");
  } else {
    await replaceImages({ items: readyItems, summary });
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
