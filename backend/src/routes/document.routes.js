import { Router } from "express";
import { deleteDocument, getDocument, listDocuments, uploadDocument } from "../controllers/document.controller.js";
import { authenticate } from "../middleware/auth.js";
import { uploadPdf } from "../middleware/upload.js";

const router = Router();
router.use(authenticate);
router.post("/", uploadPdf.single("file"), uploadDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);
export default router;
