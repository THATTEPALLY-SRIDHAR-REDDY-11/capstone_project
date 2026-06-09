import { Router } from "express";
import { login, logout, refresh, register } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginRules, registerRules } from "../validators/auth.validator.js";

const router = Router();
router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
export default router;
