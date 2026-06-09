import fs from "fs/promises";
import pdf from "pdf-parse";

export async function parsePdf(filePath) {
  const data = await fs.readFile(filePath);
  const parsed = await pdf(data);
  return {
    text: parsed.text,
    pageCount: parsed.numpages || 0,
    preview: parsed.text.slice(0, 1000)
  };
}

export function isStaleRemoteIndexWarning(message = "") {
  return message.startsWith("Remote vector indexing was skipped because the Chroma endpoint does not support this request.");
}

export async function ensureDocumentText(document) {
  if (document.extractedText) return document.extractedText;
  if (!document.filePath) return document.extractedTextPreview || "";

  const parsed = await parsePdf(document.filePath);
  document.extractedText = parsed.text;
  document.extractedTextPreview = document.extractedTextPreview || parsed.preview;
  document.pageCount = document.pageCount || parsed.pageCount;
  if (isStaleRemoteIndexWarning(document.processingError)) {
    document.processingError = undefined;
  }
  await document.save();
  return parsed.text;
}

export function chunkText(text, chunkSize = 1200, overlap = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  for (let start = 0; start < clean.length; start += chunkSize - overlap) {
    const value = clean.slice(start, start + chunkSize);
    if (value.length > 80) chunks.push({ text: value, page: Math.max(1, Math.floor(start / 2500) + 1) });
  }
  return chunks;
}
