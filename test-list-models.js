import { GoogleGenAI } from "@google/genai";
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.list();
    for await (const m of response) {
      if (m.name.includes('flash')) console.log(m.name);
    }
  } catch(e) {
    console.error(e);
  }
}
test();
