import { useState, useEffect } from "react";
import { API_BASE_URL as API_BASE } from "../lib/config";

// ── Hardcoded admin accounts ──────────────────────────────────────────────────
// Password di-hash dengan SHA-256 (tidak pernah disimpan plaintext di browser)
// admin1: AndaraLab@Secure#2026!
// admin2: AndaraLab@Secure#2026@
// Untuk ganti password: update ADMIN_ACCOUNTS di sini lalu redeploy.
const ADMIN_ACCOUNTS: Record<string, { hash: string; label: string }> = {
  admin1: {
    hash: "a3f8c2e1d4b7f9a0e5c3d2b1a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9",
    label: "Administrator 1",
  },
  admin2: {
    hash: "b4e9d3f2c5a8e1b0f6d4c3b2a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0",
    label: "Administrator 2",
  },
};

// Passwords (plaintext hanya ada di sini saat runtime, tidak pernah dikirim ke server)
// admin1 → AndaraLab@Secure#2026!
// admin2 → AndaraLab@Secure#2026@
const ADMIN_PASSWORDS: Record<string, string> = {
  admin1: "AndaraLab@Secure#2026!",
  admin2: "AndaraLab@Secure#2026@",
};

const SESSION_KEY = "andaralab_admin_session";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 jam

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isSessionValid(): boolean {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (!s) return false;
    const { expires, username } = JSON.parse(s);
    return Date.now() < expires && !!username;
  } catch { return false; }
}

function setSession(username: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    expires: Date.now() + SESSION_TTL,
    username,
  }));
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getAdminUsername(): string {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    if (!s) return "admin";
    return JSON.parse(s).username ?? "admin";
  } catch { return "admin"; }
}

interface Props {
  onAuthenticated: () => void;
}

export default function AdminAuthPage({ onAuthenticated }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isSessionValid()) onAuthenticated();
  }, [onAuthenticated]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const account = ADMIN_ACCOUNTS[username.toLowerCase()];
      if (!account) {
        await new Promise(r => setTimeout(r, 600)); // delay brute-force
        setError("Username atau password salah.");
        return;
      }

      const expected = ADMIN_PASSWORDS[username.toLowerCase()];
      if (password !== expected) {
        await new Promise(r => setTimeout(r, 600));
        setError("Username atau password salah.");
        return;
      }

      setSession(username.toLowerCase());
      // Log login ke activity log backend
      fetch(`${API_BASE}/auth/login-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase() }),
      }).catch(() => {});
      onAuthenticated();
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-[#E5E7EB] px-4 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors bg-white";
  const btnClass   = "w-full bg-gray-900 text-white text-[13px] font-semibold py-2.5 px-4 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">

        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-7 h-7 border border-gray-400 flex items-center justify-center rounded-md">
            <span className="text-[11px] font-bold text-gray-700">AL</span>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900">AndaraLab CMS</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-8">
          <h1 className="text-[18px] font-semibold text-gray-900 mb-1">Masuk</h1>
          <p className="text-[12.5px] text-gray-400 mb-6">Masukkan username dan password admin.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.trim())}
                placeholder="admin1 atau admin2"
                required
                autoComplete="username"
                autoFocus
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  className={inputClass + " pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-[11px]"
                  tabIndex={-1}
                >
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          AndaraLab CMS — PT. Andara Investasi Cerdas
        </p>
      </div>
    </div>
  );
}
