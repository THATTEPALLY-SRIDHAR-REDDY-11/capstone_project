import { Router } from "express";
import { createEvaluation } from "../controllers/evaluation.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.post("/:documentId", authenticate, authorize("Admin", "Analyst"), createEvaluation);
export default router;
