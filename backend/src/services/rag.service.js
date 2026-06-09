import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { chunkText } from "./document.service.js";
import { generateCompletion } from "./llm.service.js";

let localEmbeddingPipeline;

function embeddingModel() {
  return process.env.EMBEDDING_MODEL || (process.env.LLM_PROVIDER === "gemini" ? "embedding-001" : "text-embedding-3-small");
}

function isLocalEmbeddingModel(model) {
  return model.toLowerCase().startsWith("xenova/");
}

function collectionName(documentId) {
  const model = embeddingModel();
  const embeddingProvider = isLocalEmbeddingModel(model) ? "local" : process.env.LLM_PROVIDER === "gemini" ? "gemini" : "openai";
  const sanitizedModel = model.replace(/[^a-zA-Z0-9]/g, "_");
  return `financial_report_${embeddingProvider}_${sanitizedModel}_${documentId}`;
}

async function embedLocal(texts) {
  if (!localEmbeddingPipeline) {
    const { pipeline } = await import("@xenova/transformers");
    localEmbeddingPipeline = await pipeline("feature-extraction", embeddingModel());
  }

  const output = await localEmbeddingPipeline(texts, { pooling: "mean", normalize: true });
  const [count, dimensions] = output.dims;
  return Array.from({ length: count }, (_, index) => {
    const start = index * dimensions;
    return Array.from(output.data.slice(start, start + dimensions));
  });
}

async function embed(texts) {
  const modelName = embeddingModel();

  if (isLocalEmbeddingModel(modelName)) {
    return embedLocal(texts);
  }

  if (process.env.LLM_PROVIDER === "gemini") {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    const responses = await Promise.all(texts.map((text) => model.embedContent(text)));

    return responses.map((response) => response.embedding.values);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.embeddings.create({
    model: modelName,
    input: texts
  });
  return response.data.map((item) => item.embedding);
}

function chromaHeaders() {
  return {
    "X-Chroma-Token": process.env.CHROMA_API_KEY
  };
}

function chromaBaseUrl() {
  return process.env.CHROMA_API_URL?.replace(/\/+$/, "");
}

function hasChromaConfig() {
  return Boolean(chromaBaseUrl() && process.env.CHROMA_API_KEY);
}

function hasChromaV2Config() {
  return Boolean(hasChromaConfig() && process.env.CHROMA_TENANT && process.env.CHROMA_DATABASE);
}

function chromaV2DatabaseUrl() {
  const tenant = encodeURIComponent(process.env.CHROMA_TENANT);
  const database = encodeURIComponent(process.env.CHROMA_DATABASE);
  return `${chromaBaseUrl()}/api/v2/tenants/${tenant}/databases/${database}`;
}

function collectionPathValue(value) {
  return encodeURIComponent(value);
}

async function getOrCreateCollection(name) {
  if (!hasChromaV2Config()) {
    await axios.post(`${chromaBaseUrl()}/api/v1/collections`, { name }, { headers: chromaHeaders() }).catch(() => null);
    return { id: name, name };
  }

  const collectionsUrl = `${chromaV2DatabaseUrl()}/collections`;
  const collectionUrl = `${collectionsUrl}/${collectionPathValue(name)}`;

  try {
    const response = await axios.get(collectionUrl, { headers: chromaHeaders() });
    return response.data;
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
  }

  try {
    const response = await axios.post(collectionsUrl, { name }, { headers: chromaHeaders() });
    return response.data;
  } catch (error) {
    if (![409, 422].includes(error?.response?.status)) throw error;
    const response = await axios.get(collectionUrl, { headers: chromaHeaders() });
    return response.data;
  }
}

async function getCollection(name) {
  if (!hasChromaV2Config()) return { id: name, name };

  const response = await axios.get(
    `${chromaV2DatabaseUrl()}/collections/${collectionPathValue(name)}`,
    { headers: chromaHeaders() }
  );
  return response.data;
}

async function addRecords({ collection, documentId, chunks, embeddings }) {
  const collectionId = hasChromaV2Config() ? collection.id : collection.name;
  const addUrl = hasChromaV2Config()
    ? `${chromaV2DatabaseUrl()}/collections/${collectionPathValue(collectionId)}/add`
    : `${chromaBaseUrl()}/api/v1/collections/${collectionPathValue(collectionId)}/add`;

  await axios.post(addUrl, {
    ids: chunks.map((_, index) => `${documentId}-${index}`),
    documents: chunks.map((chunk) => chunk.text),
    metadatas: chunks.map((chunk) => ({ page: chunk.page, documentId })),
    embeddings
  }, { headers: chromaHeaders() });
}

async function queryCollection({ name, queryEmbedding }) {
  const collection = await getCollection(name);
  const collectionId = hasChromaV2Config() ? collection.id : collection.name;
  const queryUrl = hasChromaV2Config()
    ? `${chromaV2DatabaseUrl()}/collections/${collectionPathValue(collectionId)}/query`
    : `${chromaBaseUrl()}/api/v1/collections/${collectionPathValue(collectionId)}/query`;

  return axios.post(queryUrl, {
    query_embeddings: [queryEmbedding],
    n_results: 6,
    include: ["documents", "metadatas"]
  }, { headers: chromaHeaders() });
}

function remoteIndexWarning(error) {
  const status = error?.response?.status;
  if (status === 405) {
    return "Remote vector indexing was skipped because the Chroma endpoint does not support this request. The PDF text was still saved locally.";
  }
  if (status) {
    return `Remote vector indexing was skipped because Chroma returned HTTP ${status}. The PDF text was still saved locally.`;
  }
  return error.message || "Remote vector indexing was skipped. The PDF text was still saved locally.";
}

export async function indexDocument({ documentId, text }) {
  const chunks = chunkText(text);
  const name = collectionName(documentId);

  if (!chunks.length) {
    return { collection: name, chunks, skippedRemoteIndex: true, warning: "No extractable text found for indexing." };
  }

  const modelName = embeddingModel();
  const hasEmbeddingProvider = isLocalEmbeddingModel(modelName) || (process.env.LLM_PROVIDER === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);
  if (!hasEmbeddingProvider || !hasChromaConfig()) {
    return { collection: name, chunks, skippedRemoteIndex: true, warning: "Vector indexing skipped because embedding or Chroma configuration is missing." };
  }

  let embeddings;
  try {
    embeddings = await embed(chunks.map((chunk) => chunk.text));
  } catch (error) {
    return {
      collection: name,
      chunks,
      skippedRemoteIndex: true,
      warning: error.message || "Vector indexing skipped because embeddings could not be generated."
    };
  }

  try {
    const collection = await getOrCreateCollection(name);
    await addRecords({ collection, documentId, chunks, embeddings });
  } catch (error) {
    return {
      collection: name,
      chunks,
      skippedRemoteIndex: true,
      warning: remoteIndexWarning(error)
    };
  }

  return { collection: name, chunks };
}

export async function retrieveContext({ documentId, query, fallbackText = "" }) {
  const name = collectionName(documentId);
  if (!hasChromaConfig()) {
    return chunkText(fallbackText).slice(0, 5).map((chunk, index) => ({ ...chunk, sourceId: `${documentId}-${index}` }));
  }

  let response;
  try {
    const [queryEmbedding] = await embed([query]);
    response = await queryCollection({ name, queryEmbedding });
  } catch {
    return chunkText(fallbackText).slice(0, 5).map((chunk, index) => ({ ...chunk, sourceId: `${documentId}-${index}` }));
  }

  const documents = response.data.documents?.[0] || [];
  if (!documents.length) {
    return chunkText(fallbackText).slice(0, 5).map((chunk, index) => ({ ...chunk, sourceId: `${documentId}-${index}` }));
  }

  return documents.map((text, index) => ({
    text,
    page: response.data.metadatas?.[0]?.[index]?.page,
    sourceId: response.data.ids?.[0]?.[index]
  }));
}

export async function answerWithRag({ question, context, history = [] }) {
  const prompt = `Question: ${question}

Conversation history:
${history.map((m) => `${m.role}: ${m.content}`).join("\n")}

Retrieved context:
${context.map((item) => `[page ${item.page}] ${item.text}`).join("\n\n")}

Answer with investor-grade clarity and cite pages in the response.`;

  const answer = await generateCompletion({
    system: "You are a precise financial analyst. Use only retrieved context. If the context is insufficient, say so.",
    prompt
  });

  return {
    answer,
    citations: context.map((item) => ({ page: item.page, text: item.text.slice(0, 280), sourceId: item.sourceId }))
  };
}
