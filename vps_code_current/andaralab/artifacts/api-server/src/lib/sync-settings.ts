// Exchange rate sync settings — controlled via env vars
export const SYNC_CONFIG = {
  enabled: process.env.EXCHANGE_SYNC_ENABLED !== "false",
  intervalMs: Math.max(10_000, Number(process.env.EXCHANGE_SYNC_INTERVAL_MS) || 30_000),
  fetchTimeoutMs: Number(process.env.EXCHANGE_SYNC_TIMEOUT_MS) || 8000,
  maxRetries: Number(process.env.EXCHANGE_SYNC_MAX_RETRIES) || 2,
} as const;

export type SyncConfig = typeof SYNC_CONFIG;
