import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true, index: true },
  entity: String,
  entityId: String,
  ip: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);
