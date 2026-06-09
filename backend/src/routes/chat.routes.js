import { Router } from "express";
import { body } from "express-validator";
import { chat, getChatHistory } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.get("/:documentId/history", authenticate, getChatHistory);
router.post("/:documentId", authenticate, body("question").trim().isLength({ min: 2 }), validate, chat);
export default router;
