import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
  messages: [{
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: [{ page: Number, text: String, sourceId: String }],
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model("ChatHistory", chatHistorySchema);
