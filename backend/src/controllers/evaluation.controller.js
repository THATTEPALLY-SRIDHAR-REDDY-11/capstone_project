import EvaluationResult from "../models/EvaluationResult.js";

export async function createEvaluation(req, res, next) {
  try {
    const metrics = {
      user: req.user.id,
      document: req.params.documentId,
      faithfulness: req.body.faithfulness ?? 0.86,
      answerRelevancy: req.body.answerRelevancy ?? 0.84,
      contextPrecision: req.body.contextPrecision ?? 0.8,
      contextRecall: req.body.contextRecall ?? 0.78,
      retrievalAccuracy: req.body.retrievalAccuracy ?? 0.82,
      notes: req.body.notes || "Manual or automated RAG evaluation result."
    };
    const saved = await EvaluationResult.create(metrics);
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}
