import multer from "multer";
import path from "path";

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 8);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  }
});

export const resumeUpload = multer({
  storage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowed.includes(file.mimetype)) return callback(null, true);
    callback(new Error("Only PDF, DOC, and DOCX files are supported"));
  }
});
