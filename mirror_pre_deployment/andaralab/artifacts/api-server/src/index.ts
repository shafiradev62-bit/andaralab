import app from "./app";
import { logger } from "./lib/logger";
import { startExchangeRateSync } from "./lib/exchange-rate-sync.js";
import { restoreFromS3IfNeeded, logS3Status, syncAllFilesToS3 } from "./lib/s3-sync.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ── All data files managed by the store ──────────────────────────────────────
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

const DATA_DIR = process.env.DATA_DIR ?? "/data";

async function main() {
  // ── Step 1: Log S3 status ─────────────────────────────────────────────────
  logS3Status();

  // ── Step 2: Restore any missing/empty files from S3 BEFORE stores load ────
  // This is the key: stores are initialized lazily when first imported,
  // but we need files on disk before that happens.
  await restoreFromS3IfNeeded(DATA_DIR, DATA_FILES);

  // ── Step 2b: Push complete snapshot to S3 on every boot ───────────────────
  // This guarantees S3 backup stays complete even without any write operations.
  await syncAllFilesToS3(DATA_DIR, DATA_FILES);

  // ── Step 3: Start HTTP server (stores initialize on first use) ────────────
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    // Start automatic exchange rate synchronization
    startExchangeRateSync();
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
