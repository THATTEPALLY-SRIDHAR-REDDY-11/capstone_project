import AuditLog from "../models/AuditLog.js";

export async function writeAudit({ userId, action, entity, entityId, ip, metadata = {} }) {
  await AuditLog.create({ user: userId, action, entity, entityId, ip, metadata });
}
