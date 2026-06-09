import AnalysisResult from "../models/AnalysisResult.js";
import Document from "../models/Document.js";

export async function getDashboard(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!document) throw Object.assign(new Error("Document not found"), { status: 404 });
    const analysis = await AnalysisResult.findOne({ user: req.user.id, document: document.id });
    res.json({
      document,
      healthScore: analysis?.healthScore || 0,
      kpis: analysis?.metrics || [],
      risks: analysis?.risks || [],
      trends: analysis?.yearOverYear || [],
      dashboard: analysis?.dashboard || {}
    });
  } catch (error) {
    next(error);
  }
}
