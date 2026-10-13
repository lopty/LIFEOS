import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
const key = process.env.GEMINI_API_KEY?.trim();
const ai = new GoogleGenAI({ apiKey: key });
try {
  const pager = await ai.models.list({ config: { pageSize: 100 } });
  const names = [];
  for await (const model of pager) {
    if (
      model.name?.includes("gemini") &&
      model.supportedActions?.includes("generateContent")
    )
      names.push(model.name);
  }
  console.log(JSON.stringify(names));
} catch (e) {
  console.log(
    JSON.stringify({
      status: e.status,
      error: String(e.message)
        .split(key || "__empty__")
        .join("[redacted]"),
    }),
  );
}
