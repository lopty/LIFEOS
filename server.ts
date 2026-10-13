import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { apiRouter } from "./src/server/routes/api.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // Mount API endpoints
  app.use("/api", apiRouter);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "LIFEOS Living City Intelligence Engine",
    });
  });

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.argv.includes("--production");

  if (!isProduction) {
    // Development mode: Mount Vite dev server as middleware
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, process.env.HOST || "127.0.0.1", () => {
    console.log(`LIFEOS running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting LIFEOS server:", err);
  process.exit(1);
});
