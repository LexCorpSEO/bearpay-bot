import { GoogleGenAI } from "@google/genai";
import fs from "fs";
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  // dummy 1px base64 image
  const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "What is this?" },
            { inlineData: { mimeType: "image/png", data: base64Data } }
          ]
        }
      ]
    });
    console.log("SUCCESS:", response.text);
  } catch(e) {
    console.error("FAILED:", e.message);
  }
}
test();
