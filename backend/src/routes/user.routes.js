import { Router } from "express";
import { me } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.get("/me", authenticate, me);
export default router;
