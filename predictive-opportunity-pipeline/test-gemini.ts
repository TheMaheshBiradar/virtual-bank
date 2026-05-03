import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const modelsToTest = ["gemini-3-pro", "gemini-1.5-pro", "gemini-2.0-pro-exp-02-05", "gemini-2.5-pro"];
  for (const model of modelsToTest) {
    try {
      const res = await ai.models.generateContent({
        model: model,
        contents: "Hello"
      });
      console.log(`Success with ${model}`);
    } catch(e) {
      console.log(`Error with ${model}:`, e.message);
    }
  }
}
run();
