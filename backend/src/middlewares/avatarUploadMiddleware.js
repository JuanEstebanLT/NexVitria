import multer from "multer";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png"
]);

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
      const error = new Error("Solo puedes subir imágenes JPG, JPEG o PNG.");
      error.code = "INVALID_AVATAR_TYPE";
      return callback(error);
    }

    return callback(null, true);
  }
}).single("avatar");

export const avatarUploadMiddleware = (req, res, next) => {
  uploadAvatar(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "La imagen no puede superar los 5 MB."
      });
    }

    if (error.code === "INVALID_AVATAR_TYPE") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: "No fue posible procesar la imagen seleccionada."
    });
  });
};

