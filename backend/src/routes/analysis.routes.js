import { Router } from "express";
import { getAnalysis, runAnalysis } from "../controllers/analysis.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.post("/:documentId/run", authorize("Admin", "Analyst", "User"), runAnalysis);
router.get("/:documentId", getAnalysis);
export default router;
