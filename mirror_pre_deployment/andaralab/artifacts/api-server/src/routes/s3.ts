// S3 Sync Routes — /api/s3
// GET  /api/s3/status    — show S3 config status (no secrets)
// POST /api/s3/sync-now  — manually push all local data files to S3 right now
// POST /api/s3/restore   — manually pull all files from S3 (overwrites local)

import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { getS3Config, uploadToS3, downloadFromS3 } from "../lib/s3-sync.js";

const router = Router();

const DATA_DIR = process.env.DATA_DIR ?? "/data";
const DATA_FILES = [
  "datasets.json",
  "pages.json",
  "posts.json",
  "calendar-events.json",
  "calendar-config.json",
  "exchange-rates.json",
  "featured-insights.json",
  "analisis.json",
  "activity-log.json",
];

router.get("/status", (_req: Request, res: Response) => {
  const cfg = getS3Config();
  res.json({
    enabled: cfg.enabled,
    region: cfg.region,
    bucket: cfg.enabled ? cfg.bucket : "(not configured)",
    prefix: cfg.prefix,
    // Never expose credentials
    hasAccessKey: cfg.accessKeyId.length > 0,
    hasSecretKey: cfg.secretAccessKey.length > 0,
    dataFiles: DATA_FILES.map((f) => {
      const p = path.join(DATA_DIR, f);
      const exists = fs.existsSync(p);
      const size = exists ? fs.statSync(p).size : 0;
      return { file: f, localExists: exists, localSizeBytes: size };
    }),
  });
});

router.post("/sync-now", async (_req: Request, res: Response) => {
  const cfg = getS3Config();
  if (!cfg.enabled) {
    return res.status(503).json({ error: "S3 sync is not configured. Set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY env vars." });
  }

  const results: { file: string; status: string; bytes?: number }[] = [];

  for (const filename of DATA_FILES) {
    const localPath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(localPath)) {
      results.push({ file: filename, status: "skipped — not found locally" });
      continue;
    }
    try {
      const content = fs.readFileSync(localPath, "utf-8");
      await uploadToS3(filename, content);
      results.push({ file: filename, status: "uploaded", bytes: content.length });
    } catch (err: any) {
      results.push({ file: filename, status: `error: ${err?.message ?? err}` });
    }
  }

  res.json({ synced: true, timestamp: new Date().toISOString(), results });
});

router.post("/restore", async (_req: Request, res: Response) => {
  const cfg = getS3Config();
  if (!cfg.enabled) {
    return res.status(503).json({ error: "S3 sync is not configured." });
  }

  const results: { file: string; status: string; bytes?: number }[] = [];

  for (const filename of DATA_FILES) {
    try {
      const content = await downloadFromS3(filename);
      if (!content) {
        results.push({ file: filename, status: "not found in S3" });
        continue;
      }
      const localPath = path.join(DATA_DIR, filename);
      fs.writeFileSync(localPath, content, "utf-8");
      results.push({ file: filename, status: "restored", bytes: content.length });
    } catch (err: any) {
      results.push({ file: filename, status: `error: ${err?.message ?? err}` });
    }
  }

  res.json({ restored: true, timestamp: new Date().toISOString(), results, note: "Restart the server to reload data from restored files." });
});

export default router;
