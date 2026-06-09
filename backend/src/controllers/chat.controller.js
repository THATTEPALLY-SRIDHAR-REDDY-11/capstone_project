import ChatHistory from "../models/ChatHistory.js";
import Document from "../models/Document.js";
import { ensureDocumentText } from "../services/document.service.js";
import { answerWithRag, retrieveContext } from "../services/rag.service.js";
import { writeAudit } from "../utils/audit.js";

export async function getChatHistory(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!document) throw Object.assign(new Error("Document not found"), { status: 404 });
    const history = await ChatHistory.findOne({ user: req.user.id, document: document.id });
    res.json({ messages: history?.messages || [] });
  } catch (error) {
    next(error);
  }
}

export async function chat(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!document) throw Object.assign(new Error("Document not found"), { status: 404 });
    const history = await ChatHistory.findOne({ user: req.user.id, document: document.id });
    const fallbackText = await ensureDocumentText(document);
    const context = await retrieveContext({
      documentId: document.id,
      query: req.body.question,
      fallbackText
    });
    const result = await answerWithRag({ question: req.body.question, context, history: history?.messages || [] });
    const chatHistory = history || new ChatHistory({ user: req.user.id, document: document.id, messages: [] });
    chatHistory.messages.push({ role: "user", content: req.body.question });
    chatHistory.messages.push({ role: "assistant", content: result.answer, citations: result.citations });
    await chatHistory.save();
    await writeAudit({ userId: req.user.id, action: "QUERY", entity: "Document", entityId: document.id, ip: req.ip });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
