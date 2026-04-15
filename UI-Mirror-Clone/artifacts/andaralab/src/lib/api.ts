// API client — thin fetch wrapper around the AndaraLab REST API.
// Base URL is set via the api-client-react lib on app init.

import { setBaseUrl } from "@workspace/api-client-react";
import { API_BASE_URL } from "./config";

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

async function rf<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();

  const once = async (): Promise<T> => {
    const res = await fetch(url(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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

  try {
    return await once();
  } catch (e) {
    const status = (e as Error & { apiStatus?: number }).apiStatus;
    const transient =
      method === "GET" &&
      (status === 502 ||
        status === 503 ||
        status === 504 ||
        status === 429 ||
        e instanceof TypeError);
    if (transient) {
      await new Promise((r) => setTimeout(r, 400));
      return await once();
    }
    throw e;
  }
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

// ─── API Response shapes ───────────────────────────────────────────────────────

export interface ApiListResponse<T> {
  data: T[];
  meta: { total: number; category?: string; reset?: boolean };
}

export interface ApiSingleResponse<T> {
  data: T;
  meta?: { created?: boolean; updated?: boolean };
}
