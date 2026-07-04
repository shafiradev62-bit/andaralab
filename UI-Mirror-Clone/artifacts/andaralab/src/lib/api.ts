// API client — thin fetch wrapper around the AndaraLab REST API.
// Base URL is set via the api-client-react lib on app init.

import { setBaseUrl } from "@workspace/api-client-react";
import { API_BASE_URL, API_FALLBACK_BASE_URL } from "./config";

const ADMIN_TOKEN_KEY = "andaralab_admin_token";

// Initialize base URL once at module load
setBaseUrl(API_BASE_URL);

function url(path: string): string {
  // Ensure base doesn't have trailing slash for consistent joining
  const base = API_BASE_URL.replace(/\/+$/, "");
  // Ensure path starts with exactly one slash
  const normalizedPath = "/" + path.replace(/^\/+/, "");
  
  // If base is a relative path (e.g. "/api")
  if (base.startsWith("/")) {
    return `${window.location.origin}${base}${normalizedPath}`;
  }
  
  // If base is an absolute URL
  try {
    const fullBase = base.endsWith("/") ? base : `${base}/`;
    // If path starts with /, URL constructor will replace the base path.
    // So we remove leading slash from path to ensure it appends.
    const relativePath = normalizedPath.replace(/^\/+/, "");
    return new URL(relativePath, fullBase).toString();
  } catch {
    // Fallback for non-standard base URLs
    return `${base}${normalizedPath}`;
  }
}

function dedupeUrls(urls: string[]): string[] {
  return [...new Set(urls)];
}

function buildCandidateUrls(path: string): string[] {
  const candidates: string[] = [url(path)];
  const originalBase = API_BASE_URL;
  const sameOriginApi = `${window.location.origin}/api`;

  // Try same-origin /api path when configured base is absolute.
  if (!originalBase.startsWith("/")) {
    const relativePath = "/" + path.replace(/^\/+/, "");
    candidates.push(`${sameOriginApi}${relativePath}`);
  }

  // Always include explicit VPS fallback base.
  if (API_FALLBACK_BASE_URL) {
    const fallbackBase = API_FALLBACK_BASE_URL.replace(/\/+$/, "");
    const normalizedPath = "/" + path.replace(/^\/+/, "");
    if (fallbackBase.startsWith("/")) {
      candidates.push(`${window.location.origin}${fallbackBase}${normalizedPath}`);
    } else {
      const fullBase = fallbackBase.endsWith("/") ? fallbackBase : `${fallbackBase}/`;
      candidates.push(new URL(normalizedPath.replace(/^\/+/, ""), fullBase).toString());
    }
  }

  return dedupeUrls(candidates);
}

const MEMBER_TOKEN_KEY = "andaralab_member_token";

async function rf<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const candidateUrls = buildCandidateUrls(path);

  const adminToken =
    typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  const memberToken =
    typeof window !== "undefined" ? window.localStorage.getItem(MEMBER_TOKEN_KEY) : null;

  // Use admin token for admin-scoped paths, member token for member-scoped paths.
  // Admin token takes precedence if both somehow exist (e.g., admin is also logged in as member).
  const isMemberPath =
    path.startsWith("/member-auth") || path.startsWith("/subscriptions");
  const activeToken = isMemberPath && !adminToken ? memberToken : adminToken;

  const once = async (fullUrl: string): Promise<T> => {
    const requestUrl =
      method === "GET"
        ? `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}_ts=${Date.now()}`
        : fullUrl;
    const res = await fetch(requestUrl, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => null);
      let detail: string | undefined;
      try {
        const j = JSON.parse(body || "{}") as { detail?: string };
        if (typeof j.detail === "string") detail = j.detail;
      } catch {
        /* not JSON */
      }
      const err = new Error(detail ?? `HTTP ${res.status} ${res.statusText}${body && !detail ? `: ${body}` : ""}`) as Error & {
        apiDetail?: string;
        apiStatus?: number;
      };
      err.apiDetail = detail;
      err.apiStatus = res.status;
      throw err;
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  };

  let lastError: unknown;
  for (let i = 0; i < candidateUrls.length; i++) {
    const targetUrl = candidateUrls[i];
    try {
      return await once(targetUrl);
    } catch (e) {
      lastError = e;
      const status = (e as Error & { apiStatus?: number }).apiStatus;
      const transient =
        method === "GET" &&
        (status === 404 ||
          status === 429 ||
          status === 502 ||
          status === 503 ||
          status === 504 ||
          e instanceof TypeError);
      if (transient && i < candidateUrls.length - 1) {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      if (transient && i === candidateUrls.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
        return await once(targetUrl);
      }
      throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unknown API error");
}

// ─── Typed API helpers ────────────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
  return rf<T>(path);
}

export async function apiPost<T, B = unknown>(path: string, body: B): Promise<T> {
  return rf<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPut<T, B = unknown>(path: string, body: B): Promise<T> {
  return rf<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export async function apiDelete(path: string): Promise<void> {
  return rf<void>(path, { method: "DELETE" });
}

export interface AdminLoginResponse {
  data: { token: string; username: string; expiresAt: number };
}

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const res = await rf<AdminLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
  }
  return res;
}

export async function adminMe(): Promise<{ data: { username: string; expiresAt: number } }> {
  return rf<{ data: { username: string; expiresAt: number } }>("/auth/me");
}

export async function adminLogout(): Promise<void> {
  try {
    await rf<{ data: { success: boolean } }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } finally {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  }
}

// ─── API Response shapes ───────────────────────────────────────────────────────

export interface ApiListResponse<T> {
  data: T[];
  meta: { total: number; category?: string; reset?: boolean };
}

export interface ApiSingleResponse<T> {
  data: T;
  meta?: { created?: boolean; updated?: boolean };
}
