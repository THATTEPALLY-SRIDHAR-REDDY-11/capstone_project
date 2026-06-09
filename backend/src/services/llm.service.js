import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function generateCompletion({ system, prompt, json = false }) {
  if (process.env.LLM_PROVIDER === "gemini") {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
    const result = await model.generateContent(`${system}\n\n${prompt}`);
    const text = result.response.text();
    return json ? safeJson(text) : text;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    response_format: json ? { type: "json_object" } : undefined,
    messages: [{ role: "system", content: system }, { role: "user", content: prompt }]
  });
  const text = response.choices[0]?.message?.content || "";
  return json ? safeJson(text) : text;
}

function safeJson(text) {
  try {
    // Strip markdown code fences
    let cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/g, "").trim();
    // Strip single-line JS-style comments (// ...) that LLMs sometimes echo back
    cleaned = cleaned.replace(/\/\/[^\n]*/g, "");
    return JSON.parse(cleaned);
  } catch {
    // Try to extract a JSON object or array from somewhere in the text
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // fall through
      }
    }
    return { raw: text };
  }
}
