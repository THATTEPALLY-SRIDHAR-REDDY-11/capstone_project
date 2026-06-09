import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw Object.assign(new Error("Missing access token"), { status: 401 });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || !user.isActive) throw Object.assign(new Error("Unauthorized"), { status: 401 });
    req.user = user;
    next();
  } catch (error) {
    next(Object.assign(error, { status: 401 }));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(Object.assign(new Error("Forbidden"), { status: 403 }));
    }
    next();
  };
}
