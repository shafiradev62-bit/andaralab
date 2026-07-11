// API configuration — single source of truth for the backend URL.
// Accepts:
// - Relative: /api
// - Absolute with /api: http://host:3001/api
// - Absolute without /api: http://host:3001  -> auto-normalized to /api
function normalizeApiBase(raw: string): string {
  const value = raw.trim();
  if (!value) return "/api";
  if (value.startsWith("/")) return value;

  try {
    const parsed = new URL(value);
    const path = parsed.pathname.replace(/\/+$/, "");
    const normalizedPath = path === "" || path === "/" ? "/api" : path;
    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return value;
  }
}

export const API_BASE_URL = normalizeApiBase(
  import.meta.env.VITE_API_BASE_URL ?? "/api",
);

export const API_FALLBACK_BASE_URL = normalizeApiBase(
  import.meta.env.VITE_API_FALLBACK_BASE_URL ?? "http://177.7.55.182:3001/api",
);
