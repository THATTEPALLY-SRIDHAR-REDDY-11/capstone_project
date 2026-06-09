import path from "path";
import multer from "multer";
import { v4 as uuid } from "uuid";

const allowedMime = new Set(["application/pdf"]);
const allowedExtensions = new Set([".pdf"]);

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname).toLowerCase()}`)
});

export const uploadPdf = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 25) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMime.has(file.mimetype) || !allowedExtensions.has(ext)) {
      return cb(Object.assign(new Error("Only PDF files are allowed"), { status: 400 }));
    }
    cb(null, true);
  }
});
