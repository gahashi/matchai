import express from "express";
import "./config.js";
import { S3StorageProvider } from "./storage/s3-storage-provider.js";

const app = express();
const port = Number(process.env.PORT ?? "3103");
const host = process.env.HOST ?? "127.0.0.1";

app.get("/health", (_req, res) => res.json({ ok: true, service: "matchai-integrations" }));
app.get("/health/storage", async (_req, res) => {
  try {
    await new S3StorageProvider().checkBucket();
    res.json({ ok: true, storage: "s3" });
  } catch (error) {
    console.error("[health/storage]", error);
    res.status(503).json({ ok: false, storage: "unavailable" });
  }
});

// Sem upload público nesta etapa: autorização JWT e persistência ainda serão integradas.
app.listen(port, host, () => {
  console.log(`MatchAI integration health: http://${host}:${port}/health`);
});
