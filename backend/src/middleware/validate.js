import { validationResult } from "express-validator";

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(Object.assign(new Error("Validation failed"), { status: 400, errors: result.array() }));
  }
  next();
}
