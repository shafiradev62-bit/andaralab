// Optional membership config from /data/membership-config.json
// Additive file only — never touches datasets/posts/pages/activity-log.

import fs from "fs";
import path from "path";

export interface MembershipConfigFile {
  jwtSecret?: string;
  midtransServerKey?: string;
  midtransClientKey?: string;
  midtransIsProduction?: boolean;
  /** Rekening penerima (ditampilkan di halaman subscribe) */
  payoutBank?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  /** Override metode bayar Midtrans Snap — kosong = default backend */
  enabledPayments?: string[];
}

const DATA_DIR = process.env.DATA_DIR || "/data";
const CONFIG_PATH = path.join(DATA_DIR, "membership-config.json");

let cached: MembershipConfigFile | null = null;

export function getMembershipConfig(): MembershipConfigFile {
  if (cached) return cached;
  cached = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      cached = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as MembershipConfigFile;
      console.log("[membership-config] Loaded from", CONFIG_PATH);
    }
  } catch (err) {
    console.warn("[membership-config] Failed to read config:", err);
  }
  return cached;
}

export function resolveJwtSecret(): string {
  const cfg = getMembershipConfig();
  return process.env.JWT_SECRET || cfg.jwtSecret || "andaralab-member-secret-change-in-production";
}

export function resolveMidtransConfig() {
  const cfg = getMembershipConfig();
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" || cfg.midtransIsProduction === true;
  return {
    serverKey:
      process.env.MIDTRANS_SERVER_KEY ||
      cfg.midtransServerKey ||
      "SB-Mid-server-CHANGE_THIS_IN_PRODUCTION",
    clientKey:
      process.env.MIDTRANS_CLIENT_KEY ||
      cfg.midtransClientKey ||
      "SB-Mid-client-CHANGE_THIS_IN_PRODUCTION",
    isProduction,
    payoutBank: cfg.payoutBank || "Bank Mandiri",
    payoutAccountName: cfg.payoutAccountName || "PT Andara Lab",
    payoutAccountNumber: cfg.payoutAccountNumber || "",
    enabledPayments: cfg.enabledPayments,
  };
}

/** Baca ulang config dari disk (setelah admin edit file) */
export function reloadMembershipConfig(): MembershipConfigFile {
  cached = null;
  return getMembershipConfig();
}
