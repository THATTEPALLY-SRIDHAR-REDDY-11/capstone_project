import { generateCompletion } from "./llm.service.js";

export async function runFinancialAnalysis({ document, context }) {
  const prompt = `Analyze the following financial report context for ${document.companyName || "Unknown"} (${document.reportType}).
Return a valid, strict JSON object matching the following structure:
{
  "executiveSummary": "A string overview of the company's financial results and outlook",
  "investorSummary": {
    "bullishSignals": ["string signal 1", "string signal 2"],
    "bearishSignals": ["string signal 1"],
    "opportunities": ["opportunity 1"],
    "risks": ["risk 1"],
    "keyTakeaways": ["takeaway 1"]
  },
  "metrics": [
    {
      "label": "Revenue",
      "value": "$145.8B",
      "numericValue": 145800000000,
      "unit": "USD",
      "year": 2024,
      "sourcePage": 12
    }
  ],
  "risks": [
    {
      "category": "Regulatory",
      "severity": "High",
      "summary": "Detailed risk summary description",
      "sourcePage": 45
    }
  ],
  "managementDiscussion": {
    "strategy": "string description",
    "growthPlans": "string description",
    "challenges": "string description",
    "futureOutlook": "string description",
    "sentiment": "Positive/Neutral/Cautionary"
  },
  "yearOverYear": [
    {
      "metric": "Revenue",
      "years": [
        { "year": 2023, "value": "$130B", "numericValue": 130000000000 },
        { "year": 2024, "value": "$145.8B", "numericValue": 145800000000 }
      ],
      "insight": "Year over year revenue increased by 12% driven by..."
    }
  ],
  "healthScore": 85,
  "dashboard": {}
}

Analyze the financial details from the context provided below:
${context.map((item) => `[page ${item.page}] ${item.text}`).join("\n\n")}`;

  return generateCompletion({
    system: "You are an institutional equity research analyst. Be factual, cite page numbers when possible, and avoid unsupported claims. Return ONLY valid JSON — no markdown fences, no JavaScript comments. The 'healthScore' field MUST be a plain integer between 0 and 100. The 'managementDiscussion.sentiment' field MUST be one of: Positive, Neutral, Cautionary, Negative, Mixed.",
    prompt,
    json: true
  });
}
