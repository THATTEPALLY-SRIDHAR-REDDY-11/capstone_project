import mongoose from "mongoose";

const metricSchema = new mongoose.Schema({
  label: String,
  value: String,
  numericValue: Number,
  unit: String,
  year: Number,
  sourcePage: Number
}, { _id: false });

const analysisResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
  executiveSummary: String,
  investorSummary: {
    bullishSignals: [String],
    bearishSignals: [String],
    opportunities: [String],
    risks: [String],
    keyTakeaways: [String]
  },
  metrics: [metricSchema],
  risks: [{ category: String, severity: String, summary: String, sourcePage: Number }],
  managementDiscussion: {
    strategy: String,
    growthPlans: String,
    challenges: String,
    futureOutlook: String,
    sentiment: String
  },
  yearOverYear: [{ metric: String, years: [metricSchema], insight: String }],
  healthScore: { type: Number, min: 0, max: 100 },
  dashboard: mongoose.Schema.Types.Mixed,
  citations: [{ page: Number, text: String, sourceId: String }]
}, { timestamps: true });

export default mongoose.model("AnalysisResult", analysisResultSchema);
