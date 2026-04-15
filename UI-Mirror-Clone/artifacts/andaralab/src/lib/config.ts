// API configuration — single source of truth for the backend URL.
// Change VITE_API_BASE_URL in .env to point to production.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";
