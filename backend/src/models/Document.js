import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  companyName: String,
  reportType: { type: String, enum: ["Annual Report", "Balance Sheet", "Investor Presentation", "Earnings Report", "Financial Statement", "Other"], default: "Other" },
  fiscalYear: Number,
  fileName: String,
  filePath: String,
  mimeType: String,
  size: Number,
  pageCount: Number,
  status: { type: String, enum: ["uploaded", "processing", "indexed", "failed"], default: "uploaded" },
  chromaCollection: String,
  extractedText: String,
  extractedTextPreview: String,
  processingError: String
}, { timestamps: true });

export default mongoose.model("Document", documentSchema);
