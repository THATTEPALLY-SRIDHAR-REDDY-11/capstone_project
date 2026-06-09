import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/document.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import evaluationRoutes from "./routes/evaluation.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();
  const configuredOrigins = (process.env.CLIENT_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean);
  const allowedOrigins = new Set(configuredOrigins);
  const devOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(3000|4173|5173|5174|5175)$/;
  const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
  const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.has(origin)) return true;
    if (vercelPattern.test(origin)) return true;
    if (devOriginPattern.test(origin)) return true;
    return false;
  };

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
  }));
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(mongoSanitize());
  app.use(morgan("combined"));
  app.use(rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false
  }));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "financial-report-analyzer-api" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/analysis", analysisRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/evaluations", evaluationRoutes);
  app.use("/api/audit", auditRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
