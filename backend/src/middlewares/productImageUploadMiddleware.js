import path from "node:path";
import multer from "multer";

const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PRODUCT_IMAGE_TYPES = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"]
]);

const uploadProductImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PRODUCT_IMAGE_SIZE,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMimeType = ALLOWED_PRODUCT_IMAGE_TYPES.get(extension);

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      const error = new Error(
        "Solo puedes subir imágenes con extensión JPG, JPEG o PNG."
      );
      error.code = "INVALID_PRODUCT_IMAGE_TYPE";
      return callback(error);
    }

    return callback(null, true);
  }
}).single("imagen");

export const productImageUploadMiddleware = (req, res, next) => {
  uploadProductImage(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "La imagen del producto no puede superar los 5 MB."
      });
    }

    if (error.code === "INVALID_PRODUCT_IMAGE_TYPE") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Debes enviar una sola imagen en el campo 'imagen'."
      });
    }

    return res.status(400).json({
      success: false,
      message: "No fue posible procesar la imagen del producto."
    });
  });
};
