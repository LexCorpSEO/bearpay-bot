const apiKey = process.env.GEMINI_API_KEY;
import { GoogleGenAI } from "@google/genai";
async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    console.log(aiResponse.text);
  } catch (e) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  }
}
test();
