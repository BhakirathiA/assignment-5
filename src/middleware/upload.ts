import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";

export const UPLOAD_DIR = path.resolve("uploads");

const allowed = ["image/png", "image/jpeg", "application/pdf", "text/plain"];

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) =>
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file type"))
});