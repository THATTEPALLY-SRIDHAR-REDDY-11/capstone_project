import mongoose from "mongoose";

const evaluationResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
  faithfulness: Number,
  answerRelevancy: Number,
  contextPrecision: Number,
  contextRecall: Number,
  retrievalAccuracy: Number,
  notes: String
}, { timestamps: true });

export default mongoose.model("EvaluationResult", evaluationResultSchema);
