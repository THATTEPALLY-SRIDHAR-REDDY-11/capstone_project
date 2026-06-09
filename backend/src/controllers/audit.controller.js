import AuditLog from "../models/AuditLog.js";

export async function listAuditLogs(_req, res, next) {
  try {
    const logs = await AuditLog.find().populate("user", "name email role").sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}
