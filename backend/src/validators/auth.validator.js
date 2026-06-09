import { body } from "express-validator";

export const registerRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("password")
    .isStrongPassword({ minLength: 8, minSymbols: 1 })
    .withMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."),
  body("role").optional().isIn(["Admin", "Analyst", "User"]).withMessage("Invalid role.")
];

export const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 1 })
];
