import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
router.get("/", authenticate, authorize("Admin"), listAuditLogs);
export default router;
