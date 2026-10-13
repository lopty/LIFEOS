import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
const key = process.env.GEMINI_API_KEY?.trim();
const ai = new GoogleGenAI({ apiKey: key });
try {
  const result = await ai.models.generateContent({
    model: process.argv[2] || process.env.GEMINI_MODEL || "gemini-3.8-flash",
    contents: "Reply with the single word ready.",
    config: { maxOutputTokens: 32, httpOptions: { timeout: 30000 } },
  });
  console.log(JSON.stringify({ ok: true, reply: result.text }));
} catch (e) {
  const message = String(e.message || "")
    .split(key || "__no_key__")
    .join("[redacted]");
  console.log(
    JSON.stringify({ ok: false, name: e.name, status: e.status, message }),
  );
}
