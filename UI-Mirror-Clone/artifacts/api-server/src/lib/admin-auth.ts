import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface AdminUser {
  username: string;
  passwordHash: string;
  role: "superuser" | "regular";
  createdAt: string;
}

export interface AdminSession {
  token: string;
  username: string;
  expiresAt: number;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 72; // 72 hours — survive weekend deploys
const SALT_ROUNDS = 10;

// ─── Persistent stores ─────────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || "/data";
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ─── Users Store ───────────────────────────────────────────────────────
function loadUsers(): Map<string, AdminUser> {
  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const arr = JSON.parse(raw) as AdminUser[];
      return new Map(arr.map((u) => [u.username, u]));
    }
  } catch {
    // Corrupt or missing — start fresh
  }

  // Seed with admin1 as superuser
  seedUsers();
  return loadUsers();
}

function saveUsers(users: Map<string, AdminUser>) {
  ensureDataDir();
  try {
    const arr = [...users.values()];
    fs.writeFileSync(USERS_FILE, JSON.stringify(arr, null, 2), "utf-8");
  } catch (e) {
    console.error("[admin-auth] Failed to persist users:", e);
  }
}

function seedUsers() {
  const users = new Map<string, AdminUser>();
  // Note: We'll hash this synchronously for seeding
  const passwordHash = bcrypt.hashSync("AndaraLab@Secure#2026!", SALT_ROUNDS);
  users.set("admin1", {
    username: "admin1",
    passwordHash,
    role: "superuser",
    createdAt: new Date().toISOString(),
  });
  saveUsers(users);
}

let users: Map<string, AdminUser> = loadUsers();

// ─── Sessions Store ─────────────────────────────────────────────────
function loadSessions(): Map<string, AdminSession> {
  ensureDataDir();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
      const arr = JSON.parse(raw) as AdminSession[];
      const now = Date.now();
      // Only load non-expired sessions
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

// ─── Auth Functions ─────────────────────────────────────────────────
export async function validateAdminCredentials(username: string, password: string): Promise<boolean> {
  const user = users.get(username);
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export function getUser(username: string): AdminUser | undefined {
  return users.get(username);
}

export function listUsers(): AdminUser[] {
  return [...users.values()];
}

export async function createUser(username: string, password: string, role: "superuser" | "regular" = "regular"): Promise<AdminUser> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user: AdminUser = {
    username,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };
  users.set(username, user);
  saveUsers(users);
  return user;
}

export async function changePassword(username: string, newPassword: string): Promise<void> {
  const user = users.get(username);
  if (!user) throw new Error("User not found");
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordHash = passwordHash;
  users.set(username, user);
  saveUsers(users);
}

export function deleteUser(username: string): void {
  users.delete(username);
  saveUsers(users);
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

export function renewAdminSession(token: string): AdminSession | null {
  purgeExpiredSessions();
  const session = sessions.get(token);
  if (!session) return null;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  saveSessions(sessions);
  return session;
}

export function revokeAdminSession(token: string): void {
  sessions.delete(token);
  saveSessions(sessions);
}
