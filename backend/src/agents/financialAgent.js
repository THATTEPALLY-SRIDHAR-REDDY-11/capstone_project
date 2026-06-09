import { runFinancialAnalysis } from "../services/analysis.service.js";
import { answerWithRag, retrieveContext } from "../services/rag.service.js";

export async function runFinancialAgent({ document, task, question, fallbackText }) {
  const context = await retrieveContext({ documentId: document.id, query: question || task, fallbackText });
  if (task === "chat") return answerWithRag({ question, context });
  if (task === "analysis") return runFinancialAnalysis({ document, context });
  return runFinancialAnalysis({ document, context });
}
