import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken } from "../utils/tokens.js";
import { writeAudit } from "../utils/audit.js";

const lockWindowMs = 15 * 60 * 1000;

export async function register(req, res, next) {
  try {
    const { name, email, password, role = "User" } = req.body;
    const exists = await User.findOne({ email });
    if (exists) throw Object.assign(new Error("Email already registered"), { status: 409 });
    const user = new User({ name, email, role });
    await user.setPassword(password);
    await user.save();
    await writeAudit({ userId: user.id, action: "REGISTER", entity: "User", entityId: user.id, ip: req.ip });
    res.status(201).json(issueTokens(user));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw Object.assign(new Error("Account temporarily locked"), { status: 423 });
    }
    const ok = await user.verifyPassword(password);
    if (!ok) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) user.lockUntil = new Date(Date.now() + lockWindowMs);
      await user.save();
      throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();
    await writeAudit({ userId: user.id, action: "LOGIN", entity: "User", entityId: user.id, ip: req.ip });
    res.json(issueTokens(user));
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
      throw Object.assign(new Error("Invalid refresh token"), { status: 401 });
    }
    res.json(issueTokens(user));
  } catch (error) {
    next(Object.assign(error, { status: 401 }));
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { refreshTokenVersion: 1 } });
      await writeAudit({ userId: req.user.id, action: "LOGOUT", entity: "User", entityId: req.user.id, ip: req.ip });
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user, user.refreshTokenVersion),
    user: { id: user.id, name: user.name, email: user.email, role: user.role, preferences: user.preferences }
  };
}
