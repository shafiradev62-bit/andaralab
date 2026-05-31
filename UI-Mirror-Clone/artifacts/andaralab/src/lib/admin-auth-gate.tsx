// Admin Auth Gate — login screen + session management + idle timeout
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { API_BASE_URL } from "./config";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes — no more random logouts while editing
const SESSION_RENEW_INTERVAL_MS = 5 * 60 * 1000; // Renew session every 5 minutes of activity
const TOKEN_KEY = "andaralab_admin_token";
const EXPIRES_KEY = "andaralab_admin_expires";

interface AuthContextValue {
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({ token: null, logout: () => {} });

export function useAdminToken() {
  return useContext(AuthContext).token;
}

export function useAdminLogout() {
  return useContext(AuthContext).logout;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string, expiresAt: number) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const base = API_BASE_URL.replace(/\/+$/, "");
      const url = base.startsWith("/")
        ? `${window.location.origin}${base}/auth/login`
        : `${base}/auth/login`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Login failed");
        return;
      }

      const result = await res.json();
      const token = result.data?.token || result.token;
      const expiresAt = result.data?.expiresAt || result.expiresAt;

      if (token) {
        onLogin(token, expiresAt);
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="bg-white border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-[18px] font-bold text-gray-900 mb-1">AndaraLab CMS</h1>
        <p className="text-[13px] text-gray-500 mb-6">Login to access admin panel</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-gray-900"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-gray-900"
            />
          </div>

          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 px-3 py-2 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-gray-900 text-white py-2.5 text-[13px] font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-[11px] text-gray-400 mt-4 text-center">
          Session expires after 60 minutes of inactivity
        </p>
      </div>
    </div>
  );
}

// ─── Auth Gate Wrapper ────────────────────────────────────────────────────────

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    const expires = Number(localStorage.getItem(EXPIRES_KEY) || "0");
    if (saved && expires > Date.now()) return saved;
    // Expired or missing
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  });

  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setInterval>>();

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }, []);

  const handleLogin = useCallback((newToken: string, expiresAt: number) => {
    setToken(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(EXPIRES_KEY, String(expiresAt));
    lastActivityRef.current = Date.now();
  }, []);

  // Track user activity for idle timeout + auto-renew session
  useEffect(() => {
    if (!token) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listen to ALL possible user interaction events (covers rich editors, iframes, etc.)
    const events = [
      "mousemove", "keydown", "keyup", "click", "scroll",
      "touchstart", "touchmove", "pointerdown", "pointermove",
      "focus", "input", "change", "wheel", "contextmenu",
      "visibilitychange"
    ];

    events.forEach(evt => window.addEventListener(evt, resetActivity, { passive: true, capture: true }));

    // Also detect focus coming back to the window (e.g. switching tabs back)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resetActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Check idle every 30 seconds
    idleTimerRef.current = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      const expires = Number(localStorage.getItem(EXPIRES_KEY) || "0");

      if (idle > IDLE_TIMEOUT_MS || Date.now() > expires) {
        logout();
      }
    }, 30_000);

    // Auto-renew session on server every 5 minutes while user is active
    const renewTimer = setInterval(async () => {
      const idle = Date.now() - lastActivityRef.current;
      // Only renew if user was active in the last 5 minutes
      if (idle < SESSION_RENEW_INTERVAL_MS) {
        try {
          const base = API_BASE_URL.replace(/\/+$/, "");
          const url = base.startsWith("/")
            ? `${window.location.origin}${base}/auth/renew`
            : `${base}/auth/renew`;

          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: "{}",
          });

          if (res.ok) {
            const result = await res.json();
            const newExpires = result.data?.expiresAt;
            if (newExpires) {
              localStorage.setItem(EXPIRES_KEY, String(newExpires));
            }
          } else if (res.status === 401) {
            // Server says session is dead — logout gracefully
            logout();
          }
        } catch {
          // Network error — don't logout, just skip renewal
        }
      }
    }, SESSION_RENEW_INTERVAL_MS);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetActivity, { capture: true } as EventListenerOptions));
      document.removeEventListener("visibilitychange", handleVisibility);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      clearInterval(renewTimer);
    };
  }, [token, logout]);

  // Inject token into all fetch requests (monkey-patch)
  useEffect(() => {
    if (!token) return;

    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      
      // Only add token to API requests
      if (url.includes("/api/")) {
        const headers = new Headers(init?.headers);
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return originalFetch(input, { ...init, headers });
      }
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={{ token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
