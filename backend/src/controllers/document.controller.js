import AnalysisResult from "../models/AnalysisResult.js";
import ChatHistory from "../models/ChatHistory.js";
import Document from "../models/Document.js";
import { isStaleRemoteIndexWarning, parsePdf } from "../services/document.service.js";
import { indexDocument } from "../services/rag.service.js";
import { writeAudit } from "../utils/audit.js";

export async function uploadDocument(req, res, next) {
  let document;
  try {
    const metadata = req.body;
    document = await Document.create({
      user: req.user.id,
      title: metadata.title || req.file.originalname,
      companyName: metadata.companyName,
      reportType: metadata.reportType || "Other",
      fiscalYear: metadata.fiscalYear,
      fileName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "processing"
    });

    const parsed = await parsePdf(req.file.path);
    const indexed = await indexDocument({ documentId: document.id, text: parsed.text });
    Object.assign(document, {
      pageCount: parsed.pageCount,
      extractedText: parsed.text,
      extractedTextPreview: parsed.preview,
      chromaCollection: indexed.collection,
      processingError: indexed.warning || undefined,
      status: "indexed"
    });
    await document.save();
    await writeAudit({ userId: req.user.id, action: "UPLOAD", entity: "Document", entityId: document.id, ip: req.ip });
    res.status(201).json(document);
  } catch (error) {
    if (document) {
      document.status = "failed";
      document.processingError = error.message || "Document processing failed";
      await document.save().catch(() => null);
    }
    next(error);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
    const staleWarningIds = documents
      .filter((document) => document.status === "indexed" && isStaleRemoteIndexWarning(document.processingError))
      .map((document) => document.id);
    if (staleWarningIds.length) {
      await Document.updateMany({ _id: { $in: staleWarningIds }, user: req.user.id }, { $unset: { processingError: "" } });
      documents.forEach((document) => {
        if (staleWarningIds.includes(document.id)) document.processingError = undefined;
      });
    }
    res.json(documents);
  } catch (error) {
    next(error);
  }
}

export async function getDocument(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!document) throw Object.assign(new Error("Document not found"), { status: 404 });
    res.json(document);
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const document = await Document.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!document) throw Object.assign(new Error("Document not found"), { status: 404 });
    await AnalysisResult.deleteMany({ document: document.id, user: req.user.id });
    await ChatHistory.deleteMany({ document: document.id, user: req.user.id });
    await writeAudit({ userId: req.user.id, action: "DELETE", entity: "Document", entityId: document.id, ip: req.ip });
    res.json({ message: "Document deleted" });
  } catch (error) {
    next(error);
  }
}
