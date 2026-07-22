import { GoogleGenAI } from "@google/genai";
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const models = ["gemini-flash-latest", "gemini-2.0-flash-lite-001", "gemini-2.5-flash-lite", "gemini-3.5-flash"];
  for (const m of models) {
    try {
      await ai.models.generateContent({ model: m, contents: "Hi" });
      console.log(m + " OK");
    } catch(e) {
      console.log(m + " FAILED: " + e.message);
    }
  }
}
test();
