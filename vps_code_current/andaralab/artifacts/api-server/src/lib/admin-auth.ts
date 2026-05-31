import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface AdminSession {
  token: string;
  username: string;
  expiresAt: number;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 72; // 72 hours — survive weekend deploys

const ADMIN_CREDENTIALS: Record<string, string> = {
  admin1: "AndaraLab@Secure#2026!",
  admin2: "AndaraLab@Secure#2026@",
};

// ─── Persistent session store ─────────────────────────────────────────────────
// Sessions are written to /data/sessions.json so they survive container restarts.
// Same DATA_DIR pattern as store.ts.

const DATA_DIR = process.env.DATA_DIR || "/data";
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSessions(): Map<string, AdminSession> {
  ensureDataDir();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
      const arr = JSON.parse(raw) as AdminSession[];
      const now = Date.now();
      const valid = arr.filter((s) => s.expiresAt > now);
      return new Map(valid.map((s) => [s.token, s]));
    }
  } catch {
    // Corrupt or missing — start fresh
  }
  return new Map();
}

function saveSessions(sessions: Map<string, AdminSession>) {
  ensureDataDir();
  try {
    const arr = [...sessions.values()];
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(arr, null, 2), "utf-8");
  } catch (e) {
    console.error("[admin-auth] Failed to persist sessions:", e);
  }
}

const sessions = loadSessions();

function purgeExpiredSessions() {
  const now = Date.now();
  let changed = false;
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
      changed = true;
    }
  }
  if (changed) saveSessions(sessions);
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const expected = ADMIN_CREDENTIALS[username];
  return typeof expected === "string" && expected === password;
}

export function createAdminSession(username: string): AdminSession {
  purgeExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  const session: AdminSession = {
    token,
    username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(token, session);
  saveSessions(sessions);
  return session;
}

export function getAdminSession(token: string): AdminSession | null {
  purgeExpiredSessions();
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    saveSessions(sessions);
    return null;
  }
  return session;
}

/** Extend session expiry on activity — keeps user logged in while active */
export function renewAdminSession(token: string): AdminSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    saveSessions(sessions);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  saveSessions(sessions);
  return session;
}

export function revokeAdminSession(token: string): void {
  sessions.delete(token);
  saveSessions(sessions);
}
