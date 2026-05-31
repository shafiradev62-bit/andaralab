import { Router } from "express";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface CloudflareLogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  requestId?: string;
  duration?: number;
  memoryUsed?: number;
}

interface LambdaStatus {
  connected: boolean;
  functionName: string;
  region: string;
  lastInvoked?: string;
  totalInvocations: number;
  errors: number;
  avgDuration: number;
}

// ─── In-memory log buffer (populated from Cloudflare push or polling) ─────────

const LOG_BUFFER_MAX = 500;
const logBuffer: CloudflareLogEntry[] = [];
let invocationCount = 0;
let errorCount = 0;
let totalDuration = 0;
let lastInvoked: string | undefined;

function pushLog(entry: Omit<CloudflareLogEntry, "id">) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const log: CloudflareLogEntry = { id, ...entry };
  logBuffer.unshift(log); // newest first
  if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.pop();

  invocationCount++;
  if (entry.level === "ERROR") errorCount++;
  if (entry.duration != null) {
    totalDuration = Math.round((totalDuration * (invocationCount - 1) + entry.duration) / invocationCount);
  }
  lastInvoked = entry.timestamp;
}

// ─── GET /api/lambda/logs — return status + recent logs ──────────────────────

router.get("/logs", async (_req, res) => {
  const cfAccountId  = process.env.CF_ACCOUNT_ID;
  const cfApiToken   = process.env.CF_API_TOKEN;
  const cfWorkerName = process.env.CF_WORKER_NAME ?? "andaralab-worker";

  // If Cloudflare credentials are set, try to fetch live logs via CF Tail API
  if (cfAccountId && cfApiToken) {
    try {
      // Cloudflare Workers Logpush / Tail API
      // GET https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/tails
      const tailRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${cfWorkerName}/tails`,
        {
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (tailRes.ok) {
        const tailData = await tailRes.json() as { result?: { id: string; url: string }[] };
        const tails = tailData.result ?? [];

        // Also fetch recent analytics via Workers Analytics Engine if available
        const analyticsRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/analytics/workers/script/${cfWorkerName}?since=-1440`,
          {
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        let analyticsData: { result?: { totals?: { requests?: { all?: number; errors?: number }; duration?: { average?: number } }; latest?: string } } = {};
        if (analyticsRes.ok) {
          analyticsData = await analyticsRes.json();
        }

        const totals = analyticsData.result?.totals;
        const status: LambdaStatus = {
          connected: true,
          functionName: cfWorkerName,
          region: "Cloudflare Edge",
          lastInvoked: analyticsData.result?.latest ?? lastInvoked,
          totalInvocations: totals?.requests?.all ?? invocationCount,
          errors: totals?.requests?.errors ?? errorCount,
          avgDuration: totals?.duration?.average ?? totalDuration,
        };

        return res.json({
          status,
          logs: logBuffer.slice(0, 200),
          tails: tails.length,
        });
      }
    } catch (err) {
      logger.warn({ err }, "Cloudflare API fetch failed, falling back to buffer");
    }
  }

  // No credentials or fetch failed — return buffer + disconnected status
  const status: LambdaStatus = {
    connected: !!(cfAccountId && cfApiToken),
    functionName: cfWorkerName,
    region: cfAccountId ? "Cloudflare Edge" : "Not configured",
    lastInvoked,
    totalInvocations: invocationCount,
    errors: errorCount,
    avgDuration: totalDuration,
  };

  res.json({ status, logs: logBuffer.slice(0, 200) });
});

// ─── POST /api/lambda/ingest — Cloudflare Worker pushes logs here ─────────────
// Configure your Cloudflare Worker to POST to https://andaralab.id/api/lambda/ingest
// with header X-Log-Secret matching CF_LOG_SECRET env var

router.post("/ingest", (req, res) => {
  const secret = process.env.CF_LOG_SECRET;
  if (secret && req.headers["x-log-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body;
  const entries: Omit<CloudflareLogEntry, "id">[] = Array.isArray(body) ? body : [body];

  for (const entry of entries) {
    if (!entry.timestamp || !entry.message) continue;
    pushLog({
      timestamp: entry.timestamp ?? new Date().toISOString(),
      level: entry.level ?? "INFO",
      message: String(entry.message),
      requestId: entry.requestId,
      duration: typeof entry.duration === "number" ? entry.duration : undefined,
      memoryUsed: typeof entry.memoryUsed === "number" ? entry.memoryUsed : undefined,
    });
  }

  res.json({ ok: true, ingested: entries.length });
});

// ─── DELETE /api/lambda/logs — clear buffer ───────────────────────────────────

router.delete("/logs", (_req, res) => {
  logBuffer.length = 0;
  invocationCount = 0;
  errorCount = 0;
  totalDuration = 0;
  lastInvoked = undefined;
  res.json({ ok: true });
});

export default router;
