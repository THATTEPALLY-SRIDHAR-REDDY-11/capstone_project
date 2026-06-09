import AnalysisResult from "../models/AnalysisResult.js";
import Document from "../models/Document.js";
import { runFinancialAgent } from "../agents/financialAgent.js";
import { ensureDocumentText } from "../services/document.service.js";

export async function runAnalysis(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!document) throw Object.assign(new Error("Document not found"), { status: 404 });
    const fallbackText = await ensureDocumentText(document);
    const result = await runFinancialAgent({
      document,
      task: "analysis",
      question: "Extract investor summary, risks, metrics, management discussion, and year over year comparisons.",
      fallbackText
    });
    const saved = await AnalysisResult.findOneAndUpdate(
      { user: req.user.id, document: document.id },
      { user: req.user.id, document: document.id, ...result },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(saved);
  } catch (error) {
    next(error);
  }
}

export async function getAnalysis(req, res, next) {
  try {
    const result = await AnalysisResult.findOne({ user: req.user.id, document: req.params.documentId });
    if (!result) throw Object.assign(new Error("Analysis not found"), { status: 404 });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
