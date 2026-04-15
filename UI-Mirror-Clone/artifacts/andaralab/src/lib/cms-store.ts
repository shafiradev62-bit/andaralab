// cms-store.ts — Dataset API layer + TanStack Query hooks
//
// Architecture:
// - localStorage is no longer the source of truth.
//   It is used only as a **client-side cache fallback** when the API is unreachable
//   (e.g., API server not running during development).
// - All data operations go through the REST API (/api/datasets).
// - TanStack Query handles caching, loading states, background refetch, and
//   optimistic updates via useMutation + queryClient.setQueryData.
//
// To switch to a real database: replace the in-memory store in api-server with
// Drizzle ORM + PostgreSQL — no changes needed in this file.
//
// ─── Types ────────────────────────────────────────────────────────────────────

export type DataUnitType = "percent" | "currency_idr" | "currency_usd" | "number" | "custom";

export interface ChartDataset {
  id: string;
  title: string;
  titleId?: string; // Indonesian translation
  description: string;
  descriptionId?: string; // Indonesian translation
  category: string;
  subcategory?: string; // Sub-classification for specific pages
  chartType: "line" | "bar" | "area" | "combo" | "donut";
  color: string;
  unit: string;       // raw label stored here (used for display in legacy/custom)
  unitType: DataUnitType; // structured type for formatting
  // CMS-editable chart metadata
  chartTitle?: string;
  chartTitleId?: string; // Indonesian translation
  xAxisLabel?: string;
  xAxisLabelId?: string; // Indonesian translation
  yAxisLabel?: string;
  yAxisLabelId?: string; // Indonesian translation
  subtitle?: string;
  subtitleId?: string; // Indonesian translation
  // Series year/period information (e.g., "2016-2024", "Q1 2023 - Q4 2024", "2024")
  seriesYear?: string;
  columns: string[];
  // Locale-specific column display names (keyed by locale)
  // If not provided, falls back to the raw column key
  columnNames?: Partial<Record<"en" | "id", string[]>>;
  rows: Record<string, string | number>[];
  colors?: string[];
  // Combo chart config: which columns are bars vs lines
  comboConfig?: {
    barColumns: string[];   // columns to render as bars (left Y-axis)
    lineColumns: string[]; // columns to render as lines (right Y-axis)
    leftLabel?: string;     // label for left Y-axis, e.g. "Indeks"
    rightLabel?: string;   // label for right Y-axis, e.g. "(%)"
  };
  // Donut chart config
  donutConfig?: {
    labelColumn: string;    // column for category labels (e.g. "Komponen")
    valueColumn: string;   // column for numeric values (e.g. "Contribution (%)")
    showLegend?: boolean;
    showPercentage?: boolean;
    innerRadiusPercent?: number; // 0-100, default 60
    // Optional breakdown section below donut
    breakdownRows?: Record<string, string | number>[];
    breakdownLabelCol?: string;
    breakdownValueCol?: string;
    breakdownBorderColor?: string; // custom border color for breakdown section
  };
  // Y-Axis range customization
  yAxisMin?: number;
  yAxisMax?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Content Section (matches DB schema) ────────────────────────────────────────

// Allow extra fields so the admin page block editor can safely spread/update partial properties
export type ContentSection =
  | { type: "text"; content?: string; headline?: string; subheadline?: string; items?: unknown; datasetId?: string; title?: string; description?: string }
  | { type: "hero"; headline: string; subheadline?: string; ctaText?: string; ctaHref?: string; content?: string; items?: unknown; datasetId?: string; title?: string; description?: string }
  | { type: "stats"; items: { label: string; value: string; unit?: string }[]; headline?: string; subheadline?: string; content?: string; datasetId?: string; title?: string; description?: string }
  | { type: "featured"; slugs: string[]; limit?: number; headline?: string; subheadline?: string; content?: string; items?: unknown; datasetId?: string; title?: string; description?: string }
  | { type: "posts"; categories: string[]; title?: string; headline?: string; subheadline?: string; content?: string; items?: unknown; datasetId?: string; description?: string }
  | { type: "chart"; datasetId: string; title?: string; headline?: string; subheadline?: string; content?: string; items?: unknown; description?: string }
  | { type: "cta"; heading: string; body: string; buttonText: string; buttonHref: string; headline?: string; subheadline?: string; content?: string; items?: unknown; datasetId?: string; title?: string; description?: string }
  | { type: "divider"; headline?: string; subheadline?: string; content?: string; items?: unknown; datasetId?: string; title?: string; description?: string }
  | { type: "about"; headline?: string; items?: { label: string; value: string }[]; subheadline?: string; content?: string; datasetId?: string; title?: string; description?: string }
  | { type: "calendar"; title?: string; titleId?: string; subtitle?: string; subtitleId?: string; impactFilter?: string[]; regionFilter?: string; categoryFilter?: string; defaultDays?: number; showTimezone?: boolean; showActual?: boolean; showPrevious?: boolean; showConsensus?: boolean; showForecast?: boolean; headline?: string; subheadline?: string; content?: string; items?: unknown; datasetId?: string; description?: string };

// ─── Page Type ──────────────────────────────────────────────────────────────────

export interface Page {
  id: number;
  slug: string;
  locale: "en" | "id";
  status: "draft" | "published";
  title: string;
  description?: string;
  content: ContentSection[];
  linkedId?: string;
  linkedIdRecord?: Page | null;
  navLabel?: string;
  section?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Blog Post Type ────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  slug: string;
  locale: "en" | "id";
  status: "draft" | "published";
  title: string;
  excerpt?: string;
  body: string[];
  category: string;
  subcategory?: string; // Sub-classification for specific pages
  tag?: string;
  image?: string;
  readTime?: string;
  linkedId?: string;
  linkedIdRecord?: BlogPost | null;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API functions ─────────────────────────────────────────────────────────────
//
// These mirror the original localStorage functions but hit the REST API.
// They return raw data (hooks handle loading/error states).
// FALLBACK: If API is unavailable (e.g., Vercel production without backend),
// we fall back to localStorage with seed data.

import {
  apiGet, apiPost, apiPut, apiDelete,
  type ApiListResponse, type ApiSingleResponse,
} from "./api";
import {
  getSeedDatasets, getSeedPages, getSeedPosts,
  saveDatasetsToStorage, savePagesToStorage, savePostsToStorage,
  resetDatasetsToSeed, resetPagesToSeed, resetPostsToSeed,
} from "./seed-data-frontend";

export async function fetchDatasets(category?: string): Promise<ChartDataset[]> {
  try {
    const params = category ? `?category=${encodeURIComponent(category)}` : "";
    const res = await apiGet<ApiListResponse<ChartDataset>>(`/datasets${params}`);
    // Save to localStorage as cache
    saveDatasetsToStorage(res.data);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, using seed data:', error);
    // Fallback to seed data from localStorage
    const seedData = getSeedDatasets();
    return category
      ? seedData.filter(d => d.category === category)
      : seedData;
  }
}

export async function fetchDataset(id: string): Promise<ChartDataset> {
  try {
    const res = await apiGet<ApiSingleResponse<ChartDataset>>(`/datasets/${id}`);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, fetching from seed:', error);
    const seedData = getSeedDatasets();
    const found = seedData.find(d => d.id === id);
    if (!found) throw new Error(`Dataset ${id} not found`);
    return found;
  }
}

export async function createDataset(
  data: Omit<ChartDataset, "id" | "createdAt" | "updatedAt">
): Promise<ChartDataset> {
  try {
    const res = await apiPost<ApiSingleResponse<ChartDataset>>("/datasets", data);
    // Also update localStorage cache
    const currentDatasets = getSeedDatasets();
    saveDatasetsToStorage([...currentDatasets, res.data]);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, saving to localStorage only:', error);
    // Fallback: save to localStorage only
    const newDataset: ChartDataset = {
      ...data,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const currentDatasets = getSeedDatasets();
    saveDatasetsToStorage([...currentDatasets, newDataset]);
    return newDataset;
  }
}

export async function deployToVPS() {
  try {
    const res = await apiPost<{ success?: true, error?: string }>("/webhook/deploy?secret=" + (import.meta.env.VITE_DEPLOY_SECRET || "andara-secret-key"), {});
    return res;
  } catch (error) {
    console.warn("Deploy triggered failed", error);
    throw error;
  }
}

export async function bulkCreateDatasets(
  data: Omit<ChartDataset, "id" | "createdAt" | "updatedAt">[]
): Promise<ChartDataset[]> {
  try {
    const res = await apiPost<ApiListResponse<ChartDataset>>("/datasets/bulk", data);
    const currentDatasets = getSeedDatasets();
    saveDatasetsToStorage([...currentDatasets, ...res.data]);
    return res.data;
  } catch (error) {
    console.warn('API unavailable for bulkCreate, local cache not fully synced:', error);
    throw error; // Let the hook handler catch it
  }
}

export async function updateDataset(
  id: string,
  data: Partial<Omit<ChartDataset, "id" | "createdAt" | "updatedAt">>
): Promise<ChartDataset> {
  try {
    const res = await apiPut<ApiSingleResponse<ChartDataset>>(`/datasets/${id}`, data);
    // Also update localStorage cache
    const currentDatasets = getSeedDatasets();
    const updated = currentDatasets.map(d => d.id === id ? { ...d, ...data } : d);
    saveDatasetsToStorage(updated as ChartDataset[]);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, updating localStorage only:', error);
    // Fallback: update localStorage only
    const currentDatasets = getSeedDatasets();
    const index = currentDatasets.findIndex(d => d.id === id);
    if (index === -1) throw new Error(`Dataset ${id} not found`);
    const updated = { ...currentDatasets[index], ...data, updatedAt: new Date().toISOString() } as ChartDataset;
    currentDatasets[index] = updated;
    saveDatasetsToStorage(currentDatasets);
    return updated;
  }
}

export async function deleteDatasetAPI(id: string): Promise<void> {
  try {
    await apiDelete(`/datasets/${id}`);
    // Also remove from localStorage cache
    const currentDatasets = getSeedDatasets();
    saveDatasetsToStorage(currentDatasets.filter(d => d.id !== id));
  } catch (error) {
    console.warn('API unavailable, deleting from localStorage only:', error);
    // Fallback: delete from localStorage only
    const currentDatasets = getSeedDatasets();
    saveDatasetsToStorage(currentDatasets.filter(d => d.id !== id));
  }
}

export async function resetDatasets(): Promise<ChartDataset[]> {
  try {
    const res = await apiPost<ApiListResponse<ChartDataset>>("/datasets/reset", {});
    saveDatasetsToStorage(res.data);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, resetting to seed data:', error);
    // Fallback: reset to seed data
    return resetDatasetsToSeed();
  }
}

export async function fetchCategories(): Promise<string[]> {
  const res = await apiGet<{ data: string[] }>("/datasets/categories");
  return res.data;
}

// ─── Pages API ──────────────────────────────────────────────────────────────────

interface PagesApiResponse {
  data: Page[];
  meta: { total: number; locale: string; status: string };
}

interface PageApiResponse {
  data: Page;
  meta?: { created?: boolean; updated?: boolean };
}

export async function fetchPages(filter?: { locale?: string; status?: string; section?: string }): Promise<Page[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.locale) params.set("locale", filter.locale);
    if (filter?.status) params.set("status", filter.status);
    if (filter?.section) params.set("section", filter.section);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiGet<PagesApiResponse>(`/pages${qs}`);
    // Merge API data into localStorage cache (don't overwrite other locale/status pages)
    if (filter?.locale || filter?.status || filter?.section) {
      const existing = getSeedPages();
      const incoming = res.data;
      // Keep existing pages that are NOT covered by this filter
      const kept = existing.filter((p) => {
        if (filter.locale && p.locale === filter.locale) return false;
        if (!filter.locale && filter.status && p.status === filter.status) return false;
        return true;
      });
      savePagesToStorage([...kept, ...incoming]);
    } else {
      savePagesToStorage(res.data);
    }
    return res.data;
  } catch (error) {
    console.warn('API unavailable for fetchPages, using cached data:', error);
    // Fallback to localStorage cache ONLY
    const cachedPages = getSeedPages();
    // Apply filters locally if provided
    if (!filter || cachedPages.length === 0) return cachedPages;
    return cachedPages.filter(p => {
      if (filter.locale && p.locale !== filter.locale) return false;
      if (filter.status && p.status !== filter.status) return false;
      if (filter.section && p.section !== filter.section) return false;
      return true;
    });
  }
}

export async function fetchPage(id: number): Promise<Page> {
  try {
    const res = await apiGet<PageApiResponse>(`/pages/${id}`);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, fetching from seed:', error);
    const seedPages = getSeedPages();
    const found = seedPages.find(p => p.id === id);
    if (!found) throw new Error(`Page ${id} not found`);
    return found;
  }
}

export async function fetchPageBySlug(slug: string, locale?: string): Promise<Page> {
  let apiFailed = false;
  try {
    const params = new URLSearchParams();
    params.set("path", slug);
    if (locale) params.set("locale", locale);
    const res = await apiGet<PageApiResponse>(`/pages/lookup?${params.toString()}`);
    return res.data;
  } catch (lookupErr: any) {
    apiFailed = true;
  }

  // Fallback to cache immediately to prevent long loading screens
  if (apiFailed) {
    const seedPages = getSeedPages();
    const norm = slug.startsWith("/") ? slug : `/${slug}`;
    const matchSlug = (p: Page) => p.slug === norm || p.slug === norm.replace(/^\//, "");
    const published = seedPages.filter((p) => matchSlug(p) && p.status === "published");
    const pickNewest = (rows: Page[]) =>
      [...rows].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0];

    let pick: Page | undefined;
    if (locale) {
      const forLocale = published.filter((p) => p.locale === locale);
      if (forLocale.length) pick = pickNewest(forLocale);
    }
    if (!pick && published.length) pick = pickNewest(published);
    if (pick) return pick;

    const draftMatch = seedPages.find(
      (p) => matchSlug(p) && p.status === "draft" && (!locale || p.locale === locale)
    );
    if (draftMatch) {
      throw new Error("This page is still a draft. In Admin → Pages, choose Published (live) and save.");
    }
    throw new Error(`Page ${slug} not found`);
  }
  throw new Error(`Impossible code path`);
}

export async function createPage(data: Omit<Page, "id" | "createdAt" | "updatedAt">): Promise<Page> {
  try {
    const res = await apiPost<PageApiResponse>("/pages", data);
    // Update localStorage cache with new page
    const currentPages = getSeedPages();
    savePagesToStorage([...currentPages, res.data]);
    return res.data;
  } catch (error) {
    console.warn('API unavailable for createPage, saving to localStorage only:', error);
    // Fallback: save to localStorage only (for offline/demo)
    const newPage: Page = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const currentPages = getSeedPages();
    savePagesToStorage([...currentPages, newPage]);
    return newPage;
  }
}

export async function updatePage(id: number, data: Partial<Omit<Page, "id" | "createdAt" | "updatedAt">>): Promise<Page> {
  try {
    const res = await apiPut<PageApiResponse>(`/pages/${id}`, data);
    const currentPages = getSeedPages();
    savePagesToStorage(currentPages.map((p) => (p.id === id ? res.data : p)));
    return res.data;
  } catch (error) {
    console.warn('API unavailable for updatePage, updating localStorage only:', error);
    // Fallback: update localStorage only
    const currentPages = getSeedPages();
    const index = currentPages.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Page ${id} not found in cache`);
    const updated = { ...currentPages[index], ...data, updatedAt: new Date().toISOString() } as Page;
    currentPages[index] = updated;
    savePagesToStorage(currentPages);
    return updated;
  }
}

export async function deletePageAPI(id: number): Promise<void> {
  try {
    await apiDelete(`/pages/${id}`);
    const currentPages = getSeedPages();
    savePagesToStorage(currentPages.filter(p => p.id !== id));
  } catch (error) {
    console.warn('API unavailable, deleting from localStorage only:', error);
    const currentPages = getSeedPages();
    savePagesToStorage(currentPages.filter(p => p.id !== id));
  }
}

export async function resetPages(): Promise<Page[]> {
  try {
    const res = await apiPost<PagesApiResponse>("/pages/reset", {});
    savePagesToStorage(res.data);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, resetting to seed data:', error);
    return resetPagesToSeed();
  }
}

export async function linkPages(idA: number, idB: number): Promise<void> {
  await apiPost("/pages/link", { idA, idB });
}

// ─── Blog Posts API ─────────────────────────────────────────────────────────────

interface PostsApiResponse {
  data: BlogPost[];
  meta: { total: number; locale: string; status: string; category: string };
}

interface PostApiResponse {
  data: BlogPost;
  meta?: { created?: boolean; updated?: boolean };
}

export async function fetchPosts(filter?: { locale?: string; status?: string; category?: string }): Promise<BlogPost[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.locale) params.set("locale", filter.locale);
    if (filter?.status) params.set("status", filter.status);
    if (filter?.category) params.set("category", filter.category);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiGet<PostsApiResponse>(`/blog${qs}`);
    savePostsToStorage(res.data);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, using seed posts:', error);
    const seedPosts = getSeedPosts();
    if (!filter) return seedPosts;
    return seedPosts.filter(p => {
      if (filter.locale && p.locale !== filter.locale) return false;
      if (filter.status && p.status !== filter.status) return false;
      if (filter.category && p.category !== filter.category) return false;
      return true;
    });
  }
}

export async function fetchPost(id: number): Promise<BlogPost> {
  try {
    const res = await apiGet<PostApiResponse>(`/blog/${id}`);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, fetching from seed:', error);
    const seedPosts = getSeedPosts();
    const found = seedPosts.find(p => p.id === id);
    if (!found) throw new Error(`Post ${id} not found`);
    return found;
  }
}

/** Public article view: published only via API (matches page lookup semantics). */
export async function fetchPostBySlug(slug: string, locale?: string, retryCount = 0): Promise<BlogPost> {
  try {
    const q = new URLSearchParams();
    if (locale) q.set("locale", locale);
    const qs = q.toString() ? `?${q.toString()}` : "";
    const res = await apiGet<PostApiResponse>(`/blog/slug/${encodeURIComponent(slug)}${qs}`);
    // Success - update cache
    return res.data;
  } catch (apiErr) {
    const apiStatus = (apiErr as Error & { apiStatus?: number }).apiStatus;
    if (apiStatus === 404) {
      // If we get a 404 but haven't retried yet, invalidate the posts list cache and retry once
      // This handles the case where a newly created post isn't in the cache yet
      if (retryCount === 0 && typeof window !== 'undefined') {
        console.warn(`[cms-store] Article "${slug}" returned 404 - invalidating cache and retrying...`);
        // Clear the localStorage cache to force a fresh fetch
        try {
          const currentPosts = getSeedPosts();
          // Try to find the post in the current cache (might have been added but not indexed)
          const norm = slug.startsWith("/") ? slug : `/${slug}`;
          const matchSlug = (p: BlogPost) =>
            p.slug === slug || p.slug === norm || p.slug === norm.replace(/^\//, "");
          const found = currentPosts.find((p) => matchSlug(p) && p.status === "published");
          if (found) {
            console.log(`[cms-store] Found article "${slug}" in localStorage cache, returning it`);
            return found;
          }
        } catch (e) {
          // Ignore cache errors
        }
      }
      throw apiErr;
    }
    console.warn("API unavailable for fetchPostBySlug, using cache/seed:", apiErr);
    const seedPosts = getSeedPosts();
    const norm = slug.startsWith("/") ? slug : `/${slug}`;
    const matchSlug = (p: BlogPost) =>
      p.slug === slug || p.slug === norm || p.slug === norm.replace(/^\//, "");
    const published = seedPosts.filter((p) => matchSlug(p) && p.status === "published");
    const pickNewest = (rows: BlogPost[]) =>
      [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    let pick: BlogPost | undefined;
    if (locale) {
      const forLocale = published.filter((p) => p.locale === locale);
      if (forLocale.length) pick = pickNewest(forLocale);
    }
    if (!pick && published.length) pick = pickNewest(published);
    if (pick) return pick;
    const draftMatch = seedPosts.find(
      (p) => matchSlug(p) && p.status === "draft" && (!locale || p.locale === locale)
    );
    if (draftMatch) {
      const err = new Error(
        "This post is still a draft. In Admin → Blog, choose Published and save."
      ) as Error & { apiDetail?: string };
      err.apiDetail = err.message;
      throw err;
    }
    throw new Error(`Post ${slug} not found`);
  }
}

export async function createPost(data: Omit<BlogPost, "id" | "createdAt" | "updatedAt">): Promise<BlogPost> {
  try {
    const res = await apiPost<PostApiResponse>("/blog", data);
    const currentPosts = getSeedPosts();
    savePostsToStorage([...currentPosts, res.data]);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, saving to localStorage only:', error);
    const newPost: BlogPost = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const currentPosts = getSeedPosts();
    savePostsToStorage([...currentPosts, newPost]);
    return newPost;
  }
}

export async function updatePost(id: number, data: Partial<Omit<BlogPost, "id" | "createdAt" | "updatedAt">>): Promise<BlogPost> {
  try {
    const res = await apiPut<PostApiResponse>(`/blog/${id}`, data);
    const currentPosts = getSeedPosts();
    savePostsToStorage(currentPosts.map((p) => (p.id === id ? res.data : p)));
    return res.data;
  } catch (error) {
    console.warn('API unavailable, updating localStorage only:', error);
    const currentPosts = getSeedPosts();
    const index = currentPosts.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Post ${id} not found`);
    const updated = { ...currentPosts[index], ...data, updatedAt: new Date().toISOString() } as BlogPost;
    currentPosts[index] = updated;
    savePostsToStorage(currentPosts);
    return updated;
  }
}

export async function deletePostAPI(id: number): Promise<void> {
  try {
    await apiDelete(`/blog/${id}`);
    const currentPosts = getSeedPosts();
    savePostsToStorage(currentPosts.filter(p => p.id !== id));
  } catch (error) {
    console.warn('API unavailable, deleting from localStorage only:', error);
    const currentPosts = getSeedPosts();
    savePostsToStorage(currentPosts.filter(p => p.id !== id));
  }
}

export async function resetPosts(): Promise<BlogPost[]> {
  try {
    const res = await apiPost<PostsApiResponse>("/blog/reset", {});
    savePostsToStorage(res.data);
    return res.data;
  } catch (error) {
    console.warn('API unavailable, resetting to seed data:', error);
    return resetPostsToSeed();
  }
}

export async function linkPosts(idA: number, idB: number): Promise<void> {
  await apiPost("/blog/link", { idA, idB });
}

// ─── Analisis Deskriptif Types ─────────────────────────────────────────────────

export type AnalysisWidgetType =
  | "metric-card"
  | "comparison"
  | "bar-chart"
  | "donut-chart"
  | "trend-line"
  | "highlight"
  | "distribution"
  | "custom-text";

export interface AnalysisMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  note?: string;
  color?: string;
}

export interface AnalysisWidget {
  id: string;
  type: AnalysisWidgetType;
  title?: string;
  subtitle?: string;
  metrics?: AnalysisMetric[];
  compareItems?: { label: string; values: string[] }[];
  compareHeaders?: string[];
  barData?: { label: string; value: number; color?: string }[];
  distributionItems?: { label: string; value: number; percentage: number; color?: string }[];
  text?: string;
  calloutColor?: string;
  html?: string;
}

export interface AnalysisSection {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  locale: "en" | "id" | "both";
  sectionType: "overview" | "dataset-breakdown" | "blog-insights" | "custom";
  order: number;
  sectionBg?: string;
  widgets: AnalysisWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalisisDeskriptif {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  locale: "en" | "id" | "both";
  status: "active" | "archived";
  sections: AnalysisSection[];
  linkedId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Analisis Deskriptif API ────────────────────────────────────────────────────

interface AnalisisApiResponse {
  data: AnalisisDeskriptif[];
  meta: { total: number; status: string };
}

interface AnalisisSingleResponse {
  data: AnalisisDeskriptif;
  meta?: { created?: boolean; updated?: boolean };
}

export async function fetchAnalisisList(filter?: { status?: string }): Promise<AnalisisDeskriptif[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.status) params.set("status", filter.status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await apiGet<AnalisisApiResponse>(`/analisis${qs}`);
    return res.data;
  } catch (error) {
    console.warn('API unavailable for fetchAnalisisList, using sample data:', error);
    // Always return sample data so UI always shows something editable in CMS
    return [
      {
        id: "default-overview",
        title: "Gambaran Umum Sistem",
        titleEn: "System Overview",
        description: "Analisis otomatis dari data CMS: datasets, blog posts, dan pages.",
        descriptionEn: "Auto-generated analysis from CMS data: datasets, blog posts, and pages.",
        locale: "both",
        status: "active",
        sections: [
          {
            id: "s1-coverage",
            title: "Cakupan Data",
            titleEn: "Data Coverage",
            description: "Distribusi konten berdasarkan kategori dan bahasa.",
            locale: "both",
            sectionType: "overview",
            order: 1,
            widgets: [
              {
                id: "w1",
                type: "metric-card",
                title: "Total Konten",
                metrics: [
                  { id: "m1", label: "Datasets", value: "11", trend: "neutral", note: "11 chart datasets available" },
                  { id: "m2", label: "Blog Posts", value: "15", trend: "up", trendValue: "+3 this month", note: "14 published, 1 draft" },
                  { id: "m3", label: "Pages", value: "14", trend: "neutral", note: "EN + ID versions" },
                  { id: "m4", label: "Kategori Dataset", value: "4", trend: "neutral", note: "Macro, Sectoral, Market, Financial" },
                ],
              },
              {
                id: "w2",
                type: "distribution",
                title: "Distribusi Dataset per Kategori",
                subtitle: "Focus Area AndaraLab",
                distributionItems: [
                  { label: "Sectoral Intelligence", value: 4, percentage: 36, color: "#1e3a5f" },
                  { label: "Macro Foundations", value: 3, percentage: 27, color: "#1e3a5f" },
                  { label: "Market Dashboard", value: 2, percentage: 18, color: "#1e3a5f" },
                  { label: "Financial Markets", value: 1, percentage: 9, color: "#1e3a5f" },
                ],
              },
              {
                id: "w3",
                type: "highlight",
                title: "Key Insight",
                calloutColor: "#1e3a5f",
                text: "Sectoral Intelligence mendominasi dengan 36% dari total dataset, menunjukkan fokus AndaraLab pada analisis sektoral ekonomi Indonesia. Nickel dan Energi Terbarukan menjadi topik utama.",
              },
            ],
            createdAt: "2026-01-01",
            updatedAt: "2026-04-06",
          },
          {
            id: "s2-blog",
            title: "Konten Blog",
            titleEn: "Blog Content",
            description: "Analisis distribusi dan kualitas artikel blog.",
            locale: "both",
            sectionType: "blog-insights",
            order: 2,
            widgets: [
              {
                id: "w4",
                type: "metric-card",
                title: "Blog Statistics",
                metrics: [
                  { id: "m5", label: "Published", value: "13", trend: "up", trendValue: "93%", note: "1 draft pending" },
                  { id: "m6", label: "English Posts", value: "10", trend: "up", trendValue: "71%", note: "Primary language" },
                  { id: "m7", label: "Indonesian Posts", value: "4", trend: "neutral", trendValue: "29%", note: "Growing content" },
                  { id: "m8", label: "Categories", value: "5", trend: "neutral", note: "economics, sectoral, etc." },
                ],
              },
              {
                id: "w5",
                type: "distribution",
                title: "Distribusi Blog per Kategori",
                distributionItems: [
                  { label: "Economics 101", value: 4, percentage: 29, color: "#1e3a5f" },
                  { label: "Sectoral Analysis", value: 4, percentage: 29, color: "#1e3a5f" },
                  { label: "Financial Markets", value: 2, percentage: 14, color: "#1e3a5f" },
                  { label: "Policy Analysis", value: 2, percentage: 14, color: "#1e3a5f" },
                  { label: "Market Pulse", value: 1, percentage: 7, color: "#1e3a5f" },
                  { label: "Lab Notes", value: 1, percentage: 7, color: "#1e3a5f" },
                ],
              },
              {
                id: "w6",
                type: "highlight",
                title: "Content Strategy Insight",
                calloutColor: "#1e3a5f",
                text: "Dominasi konten economics-101 dan sectoral-analysis menunjukkan positioning AndaraLab sebagai platform edukasi + analisis. Rasio EN:ID sebesar 71:29 mengindikasikan target audience global.",
              },
            ],
            createdAt: "2026-01-01",
            updatedAt: "2026-04-06",
          },
        ],
        linkedId: undefined,
        createdAt: "2026-01-01",
        updatedAt: "2026-04-06",
      },
    ];
  }
}

export async function fetchAnalisis(id: string): Promise<AnalisisDeskriptif> {
  try {
    const res = await apiGet<AnalisisSingleResponse>(`/analisis/${id}`);
    return res.data;
  } catch (error) {
    console.warn('API unavailable for fetchAnalisis:', error);
    throw new Error(`Analisis ${id} not found`);
  }
}

export async function createAnalisis(
  data: Omit<AnalisisDeskriptif, "id" | "createdAt" | "updatedAt">
): Promise<AnalisisDeskriptif> {
  const res = await apiPost<AnalisisSingleResponse>("/analisis", data);
  return res.data;
}

export async function updateAnalisis(
  id: string,
  data: Partial<Omit<AnalisisDeskriptif, "id" | "createdAt" | "updatedAt">>
): Promise<AnalisisDeskriptif> {
  const res = await apiPut<AnalisisSingleResponse>(`/analisis/${id}`, data);
  return res.data;
}

export async function deleteAnalisisAPI(id: string): Promise<void> {
  await apiDelete(`/analisis/${id}`);
}

export async function resetAnalisis(): Promise<AnalisisDeskriptif[]> {
  const res = await apiPost<AnalisisApiResponse>("/analisis/reset", {});
  return res.data;
}

// ─── TanStack Query hooks ────────────────────────────────────────────────────────
//
// Pages import these instead of calling the API functions directly.
// Hooks handle: loading state, error state, cache invalidation on mutations,
// and background refetching.
//
// Query keys follow the pattern: ["entity", "action", ...identifiers]
// This makes invalidation granular (e.g., invalidate ["datasets"] to refetch all lists).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const QUERY_KEY = {
  datasets: ["datasets"] as const,
  dataset: (id: string) => ["dataset", id] as const,
  categories: ["categories"] as const,
  pages: ["pages"] as const,
  page: (id: number) => ["page", id] as const,
  posts: ["posts"] as const,
  post: (id: number) => ["post", id] as const,
  analisis: ["analisis"] as const,
  analisisRecord: (id: string) => ["analisis", id] as const,
  featuredInsights: (locale: string) => ["featured-insights", locale] as const,
};

// useDatasets — fetch all datasets (optionally filtered by category)
export function useDatasets(category?: string) {
  return useQuery({
    queryKey: category ? [...QUERY_KEY.datasets, { category }] : QUERY_KEY.datasets,
    queryFn: () => fetchDatasets(category),
    staleTime: 1000 * 60 * 5,
  });
}

// useDataset — fetch a single dataset by ID
export function useDataset(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEY.dataset(id ?? ""),
    queryFn: () => fetchDataset(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

// useCategories — fetch unique categories
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEY.categories,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // categories change rarely
  });
}

// ─── Mutation hooks ─────────────────────────────────────────────────────────────
//
// Each mutation invalidates the datasets list query so the UI stays in sync.

export function useCreateDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDataset,
    onSuccess: () => {
      // Invalidate list so it refetches and includes the new entry
      qc.invalidateQueries({ queryKey: QUERY_KEY.datasets });
    },
  });
}

export function useDeployToVPS() {
  return useMutation({
    mutationFn: deployToVPS,
  });
}

export function useBulkCreateDatasets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateDatasets,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.datasets });
    },
  });
}

export function useUpdateDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateDataset>[1] }) =>
      updateDataset(id, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update: immediately show the change in the UI
      await qc.cancelQueries({ queryKey: QUERY_KEY.dataset(id) });
      const previous = qc.getQueryData<ChartDataset>(QUERY_KEY.dataset(id));
      qc.setQueryData<ChartDataset>(QUERY_KEY.dataset(id), (old) =>
        old ? { ...old, ...data } : old
      );
      return { previous };
    },
    onError: (_err, { id }, context) => {
      // Roll back optimistic update on error
      if (context?.previous) {
        qc.setQueryData(QUERY_KEY.dataset(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      // Always refetch after mutation to ensure server state is reflected
      qc.invalidateQueries({ queryKey: QUERY_KEY.dataset(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.datasets });
    },
  });
}

export function useDeleteDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDatasetAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.datasets });
    },
  });
}

export function useResetDatasets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetDatasets,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.datasets });
    },
  });
}

// ─── Pages hooks ────────────────────────────────────────────────────────────────

export function usePages(filter?: { locale?: string; status?: string; section?: string }) {
  return useQuery({
    queryKey: filter ? [...QUERY_KEY.pages, filter] : QUERY_KEY.pages,
    queryFn: () => fetchPages(filter),
    staleTime: 1000 * 30, // 30s — navbar picks up new pages quickly
    refetchOnWindowFocus: true,
  });
}

export function usePage(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEY.page(id ?? 0),
    queryFn: () => fetchPage(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}



function noRetryOn404(failureCount: number, err: Error) {
  const status = (err as Error & { apiStatus?: number }).apiStatus;
  if (status === 404) return false;
  return failureCount < 2;
}

export function usePageBySlug(slug: string, locale?: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["page", "slug", slug, locale ?? "all"],
    queryFn: async () => {
      try {
        return await fetchPageBySlug(slug, locale);
      } catch (err) {
        // Before throwing, try to find the page in any cached usePages query data
        const norm = slug.startsWith("/") ? slug : `/${slug}`;
        const matchSlug = (p: Page) => p.slug === norm || p.slug === norm.replace(/^\//, "");
        const cache = qc.getQueriesData<Page[]>({ queryKey: QUERY_KEY.pages });
        for (const [, pages] of cache) {
          if (!Array.isArray(pages)) continue;
          const published = pages.filter((p) => matchSlug(p) && p.status === "published");
          if (!published.length) continue;
          const pickNewest = (rows: Page[]) =>
            [...rows].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0];
          if (locale) {
            const forLocale = published.filter((p) => p.locale === locale);
            if (forLocale.length) return pickNewest(forLocale);
          }
          return pickNewest(published);
        }
        throw err;
      }
    },
    enabled: Boolean(slug),
    staleTime: 30_000,
    retry: false,
  });
}

function invalidatePageSlugQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["page", "slug"] });
}

export function usePostBySlug(slug: string, locale?: string) {
  return useQuery({
    queryKey: ["post", "slug", slug, locale ?? "all"],
    queryFn: () => fetchPostBySlug(slug, locale),
    enabled: Boolean(slug),
    staleTime: 1000 * 10, // 10 seconds - refetch more often to catch new articles
    retry: (failureCount, err) => {
      const status = (err as Error & { apiStatus?: number }).apiStatus;
      // Don't retry on 404 after first attempt
      if (status === 404) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });
}

function invalidatePostSlugQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["post", "slug"] });
}

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.pages });
      invalidatePageSlugQueries(qc);
    },
  });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updatePage>[1] }) =>
      updatePage(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY.page(id) });
      const previous = qc.getQueryData<Page>(QUERY_KEY.page(id));
      qc.setQueryData<Page>(QUERY_KEY.page(id), (old) => old ? { ...old, ...data } : old);
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) qc.setQueryData(QUERY_KEY.page(id), context.previous);
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.page(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.pages });
      invalidatePageSlugQueries(qc);
    },
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePageAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.pages });
      invalidatePageSlugQueries(qc);
    },
  });
}

export function useResetPages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetPages,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.pages });
      invalidatePageSlugQueries(qc);
    },
  });
}

// ─── Blog posts hooks ──────────────────────────────────────────────────────────

export function usePosts(filter?: { locale?: string; status?: string; category?: string }) {
  return useQuery({
    queryKey: filter ? [...QUERY_KEY.posts, filter] : QUERY_KEY.posts,
    queryFn: () => fetchPosts(filter),
    staleTime: 1000 * 10, // 10 seconds - refetch more often to catch new articles
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });
}

export function usePost(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEY.post(id ?? 0),
    queryFn: () => fetchPost(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Aggressively invalidate all post-related caches
      qc.invalidateQueries({ queryKey: QUERY_KEY.posts });
      invalidatePostSlugQueries(qc);
      // Also remove the cache to force a fresh fetch on next access
      qc.removeQueries({ queryKey: QUERY_KEY.posts });
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updatePost>[1] }) =>
      updatePost(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY.post(id) });
      const previous = qc.getQueryData<BlogPost>(QUERY_KEY.post(id));
      qc.setQueryData<BlogPost>(QUERY_KEY.post(id), (old) => old ? { ...old, ...data } : old);
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) qc.setQueryData(QUERY_KEY.post(id), context.previous);
    },
    onSettled: (_data, _err, { id }) => {
      // Aggressively invalidate all post-related caches
      qc.invalidateQueries({ queryKey: QUERY_KEY.post(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.posts });
      invalidatePostSlugQueries(qc);
      // Remove caches to force fresh fetch
      qc.removeQueries({ queryKey: QUERY_KEY.posts });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePostAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.posts });
      invalidatePostSlugQueries(qc);
    },
  });
}

export function useResetPosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetPosts,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.posts });
      invalidatePostSlugQueries(qc);
    },
  });
}

// ─── Analisis Deskriptif hooks ──────────────────────────────────────────────────

export function useAnalisisList(filter?: { status?: string }) {
  return useQuery({
    queryKey: filter ? [...QUERY_KEY.analisis, filter] : QUERY_KEY.analisis,
    queryFn: () => fetchAnalisisList(filter),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalisis(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEY.analisisRecord(id ?? ""),
    queryFn: () => fetchAnalisis(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateAnalisis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAnalisis,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.analisis });
    },
  });
}

export function useUpdateAnalisis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAnalisis>[1] }) =>
      updateAnalisis(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.analisisRecord(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.analisis });
    },
  });
}

export function useDeleteAnalisis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAnalisisAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.analisis });
    },
  });
}

export function useResetAnalisis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetAnalisis,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.analisis });
    },
  });
}

// ─── Featured Insights hooks ─────────────────────────────────────────────────────

export function useFeaturedInsights(locale: "en" | "id") {
  return useQuery({
    queryKey: QUERY_KEY.featuredInsights(locale),
    queryFn: () => fetchFeaturedInsights(locale),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useUpdateFeaturedInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locale, data }: { locale: "en" | "id"; data: Parameters<typeof updateFeaturedInsights>[1] }) =>
      updateFeaturedInsights(locale, data),
    onSuccess: (_data, { locale }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.featuredInsights(locale) });
    },
  });
}

export function useResetFeaturedInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetFeaturedInsights,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["featured-insights"] });
    },
  });
}

// ─── Featured Insights Config API ─────────────────────────────────────────────

export interface FeaturedInsight {
  slug: string;
  label: string;
  order: number;
}

export interface FeaturedInsightsConfig {
  id: string;
  locale: "en" | "id";
  slugs: FeaturedInsight[];
  title: string;
  subtitle: string;
  sectionLabel: string;
  limit: number;
  showOnHomepage: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeaturedInsightsResponse {
  data: FeaturedInsightsConfig;
  meta?: { updated?: boolean };
}

export async function fetchFeaturedInsights(locale: "en" | "id"): Promise<FeaturedInsightsConfig> {
  try {
    const res = await apiGet<FeaturedInsightsResponse>(`/featured-insights/${locale}`);
    return res.data;
  } catch (error) {
    console.warn('API unavailable for fetchFeaturedInsights, using sample data:', error);
    // Always return sample data with selected posts so UI always shows something editable in CMS
    return locale === "id"
      ? {
          id: "featured-id",
          locale: "id",
          slugs: [
            { slug: "ri-transmigration-nickel-downstreaming", label: "", order: 1 },
            { slug: "prospek-makro-indonesia-2026-id", label: "", order: 2 },
            { slug: "food-inflation-handling-indonesia", label: "", order: 3 },
          ],
          title: "Wawasan Pilihan",
          subtitle: "Riset dan analisis terbaru dari AndaraLab",
          sectionLabel: "Riset Pilihan",
          limit: 3,
          showOnHomepage: true,
          createdAt: "2026-01-01",
          updatedAt: "2026-04-06",
        }
      : {
          id: "featured-en",
          locale: "en",
          slugs: [
            { slug: "nickel-ev-indonesia", label: "", order: 1 },
            { slug: "digital-economy-indonesia-2026", label: "", order: 2 },
            { slug: "bank-mandatory-ratio-q1-2026", label: "", order: 3 },
          ],
          title: "Featured Insights",
          subtitle: "Latest research and analysis from AndaraLab",
          sectionLabel: "Featured Research",
          limit: 3,
          showOnHomepage: true,
          createdAt: "2026-01-01",
          updatedAt: "2026-04-06",
        };
  }
}

export async function updateFeaturedInsights(
  locale: "en" | "id",
  data: Partial<Omit<FeaturedInsightsConfig, "id" | "locale" | "createdAt" | "updatedAt">>
): Promise<FeaturedInsightsConfig> {
  const res = await apiPut<FeaturedInsightsResponse>(`/featured-insights/${locale}`, data);
  return res.data;
}

export async function resetFeaturedInsights(): Promise<void> {
  await apiPost("/featured-insights/reset", {});
}

// ─── Legacy compatibility layer ─────────────────────────────────────────────────
//
// The original localStorage-based functions are kept so existing code
// (e.g. non-React contexts) continues to work without changes.
// New code should prefer the query hooks above.

const STORAGE_KEY = "andaralab_cms_datasets";

export function loadDatasets(): ChartDataset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveDatasets(datasets: ChartDataset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}

// ─── Exchange Rate Types ─────────────────────────────────────────────────────────

export interface ExchangeRate {
  id: string;
  symbol: string;
  label: string;
  labelEn?: string;
  labelId?: string;
  value: string;
  change: string;
  changeValue: number;
  up: boolean | null;
  category: "currency" | "index" | "commodity" | "bond";
  order: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Exchange Rate API ──────────────────────────────────────────────────────────

export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const res = await apiGet<{ data: ExchangeRate[]; meta: { total: number } }>("/exchange-rates");
    return res.data;
  } catch (error) {
    console.warn('API unavailable for fetchExchangeRates, using sample data:', error);
    // Always return sample data so UI always shows something editable in CMS
    return [
      {
        id: "idr-usd",
        symbol: "IDR/USD",
        label: "IDR/USD",
        labelEn: "IDR/USD",
        labelId: "IDR/USD",
        value: "17,100",
        change: "-0.04%",
        changeValue: -0.04,
        up: false,
        category: "currency",
        order: 1,
        enabled: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-04-13",
      },
      {
        id: "jci",
        symbol: "JCI",
        label: "JCI",
        labelEn: "JCI",
        labelId: "IHSG",
        value: "7,456",
        change: "-0.04%",
        changeValue: -0.04,
        up: false,
        category: "index",
        order: 2,
        enabled: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-04-13",
      },
      {
        id: "bi-rate",
        symbol: "BI Rate",
        label: "BI Rate",
        labelEn: "BI Rate",
        labelId: "Suku Bunga BI",
        value: "6.00%",
        change: "Unch",
        changeValue: 0,
        up: null,
        category: "bond",
        order: 3,
        enabled: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-04-08",
      },
      {
        id: "us-10y",
        symbol: "US 10Y",
        label: "US 10Y",
        labelEn: "US 10Y",
        labelId: "Imbal Hasil US 10Y",
        value: "4.28%",
        change: "-0.05%",
        changeValue: -0.05,
        up: true,
        category: "bond",
        order: 4,
        enabled: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-04-08",
      },
      {
        id: "gold",
        symbol: "Gold",
        label: "Gold",
        labelEn: "Gold",
        labelId: "Emas",
        value: "$4,755",
        change: "-0.67%",
        changeValue: -0.67,
        up: false,
        category: "commodity",
        order: 5,
        enabled: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-04-13",
      },
      {
        id: "brent",
        symbol: "Brent",
        label: "Brent",
        labelEn: "Brent Crude",
        labelId: "Minyak Brent",
        value: "$68.5",
        change: "-0.52%",
        changeValue: -0.52,
        up: false,
        category: "commodity",
        order: 6,
        enabled: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-04-13",
      },
    ];
  }
}

export async function createExchangeRate(
  data: Omit<ExchangeRate, "id" | "createdAt" | "updatedAt">
): Promise<ExchangeRate> {
  const res = await apiPost<{ data: ExchangeRate }>("/exchange-rates", data);
  return res.data;
}

export async function updateExchangeRate(
  id: string,
  data: Partial<Omit<ExchangeRate, "id" | "createdAt" | "updatedAt">>
): Promise<ExchangeRate> {
  const res = await apiPut<{ data: ExchangeRate }>(`/exchange-rates/${id}`, data);
  return res.data;
}

export async function deleteExchangeRateAPI(id: string): Promise<void> {
  await apiDelete(`/exchange-rates/${id}`);
}

export async function resetExchangeRates(): Promise<ExchangeRate[]> {
  const res = await apiPost<{ data: ExchangeRate[] }>("/exchange-rates/reset", {});
  return res.data;
}

export async function reorderExchangeRates(ids: string[]): Promise<ExchangeRate[]> {
  const res = await apiPost<{ data: ExchangeRate[] }>("/exchange-rates/reorder", { ids });
  return res.data;
}

// ─── Exchange Rate Hooks ────────────────────────────────────────────────────────

export function useExchangeRates() {
  return useQuery({
    queryKey: ["exchange-rates"] as const,
    queryFn: fetchExchangeRates,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 1, // Polling every 1 minute
  });
}

export function useCreateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExchangeRate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
  });
}

export function useUpdateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateExchangeRate>[1] }) =>
      updateExchangeRate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
  });
}

export function useDeleteExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExchangeRateAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
  });
}

export function useResetExchangeRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetExchangeRates,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
  });
}

export function useReorderExchangeRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reorderExchangeRates,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] });
    },
  });
}

// ─── Calendar Event Types ────────────────────────────────────────────────────────

export type CalendarImpact = "low" | "medium" | "high";
export type CalendarRegion = "all" | "major" | "america" | "europe" | "asia" | "africa";

export interface CalendarEvent {
  id: string;
  date: string;           // ISO date string e.g. "2026-04-08"
  time: string;           // e.g. "13:30" (24h format)
  countryCode: string;    // e.g. "US", "ID", "CN"
  countryLabel: string;   // e.g. "United States", "Indonesia"
  eventName: string;
  eventNameId?: string;   // Indonesian translation
  impact: CalendarImpact;
  actual?: string;
  previous?: string;
  consensus?: string;
  forecast?: string;
  category: string;       // e.g. "Interest Rate", "GDP Growth", "Inflation"
  region: CalendarRegion;
  enabled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarConfig {
  id: string;
  title: string;
  titleId: string;
  subtitle?: string;
  subtitleId?: string;
  impactFilter: CalendarImpact[];
  regionFilter: CalendarRegion;
  categoryFilter: string;
  defaultDays: number;   // e.g. 7 = show next 7 days
  showTimezone: boolean;
  showActual: boolean;
  showPrevious: boolean;
  showConsensus: boolean;
  showForecast: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Calendar Event API ─────────────────────────────────────────────────────────

export async function fetchCalendarEvents(params?: {
  days?: number;
  impact?: CalendarImpact[];
  region?: CalendarRegion;
  category?: string;
  country?: string;
}): Promise<CalendarEvent[]> {
  try {
    const qp = new URLSearchParams();
    if (params?.days) qp.set("days", String(params.days));
    if (params?.impact) qp.set("impact", params.impact.join(","));
    if (params?.region) qp.set("region", params.region);
    if (params?.category) qp.set("category", params.category);
    if (params?.country) qp.set("country", params.country);
    const qs = qp.toString() ? `?${qp.toString()}` : "";
    const res = await apiGet<{ data: CalendarEvent[]; meta: { total: number } }>(`/calendar/events${qs}`);
    return res.data;
  } catch (error) {
    console.warn('API unavailable for fetchCalendarEvents, using sample data:', error);
    // Always return sample data so UI always shows something editable in CMS
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
    
    return [
      {
        id: "cal-1",
        date: today,
        time: "13:30",
        countryCode: "US",
        countryLabel: "United States",
        eventName: "Non-Farm Payrolls",
        eventNameId: "Data Gaji Non-Pertanian",
        impact: "high",
        actual: "",
        previous: "275K",
        consensus: "198K",
        forecast: "210K",
        category: "Labour Market",
        region: "all",
        enabled: true,
        order: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "cal-2",
        date: today,
        time: "15:00",
        countryCode: "US",
        countryLabel: "United States",
        eventName: "ISM Manufacturing PMI",
        eventNameId: "PMI Manufaktur ISM",
        impact: "high",
        actual: "",
        previous: "50.3",
        consensus: "50.5",
        forecast: "50.8",
        category: "Business Confidence",
        region: "all",
        enabled: true,
        order: 2,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "cal-3",
        date: tomorrow,
        time: "07:30",
        countryCode: "ID",
        countryLabel: "Indonesia",
        eventName: "BI Rate Decision",
        eventNameId: "Keputusan Suku Bunga BI",
        impact: "high",
        actual: "",
        previous: "6.00%",
        consensus: "6.00%",
        forecast: "6.00%",
        category: "Interest Rate",
        region: "all",
        enabled: true,
        order: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "cal-4",
        date: tomorrow,
        time: "09:00",
        countryCode: "CN",
        countryLabel: "China",
        eventName: "CPI YoY",
        eventNameId: "IHK YoY",
        impact: "medium",
        actual: "",
        previous: "0.2%",
        consensus: "0.3%",
        forecast: "0.4%",
        category: "Prices & Inflation",
        region: "all",
        enabled: true,
        order: 2,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "cal-5",
        date: dayAfter,
        time: "14:00",
        countryCode: "EU",
        countryLabel: "Euro Area",
        eventName: "ECB Interest Rate Decision",
        eventNameId: "Keputusan Suku Bunga ECB",
        impact: "high",
        actual: "",
        previous: "4.50%",
        consensus: "4.25%",
        forecast: "4.25%",
        category: "Interest Rate",
        region: "europe",
        enabled: true,
        order: 1,
        createdAt: "",
        updatedAt: "",
      },
    ];
  }
}

export async function createCalendarEvent(
  data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">
): Promise<CalendarEvent> {
  const res = await apiPost<{ data: CalendarEvent }>("/calendar/events", data);
  return res.data;
}

export async function updateCalendarEvent(
  id: string,
  data: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>
): Promise<CalendarEvent> {
  const res = await apiPut<{ data: CalendarEvent }>(`/calendar/events/${id}`, data);
  return res.data;
}

export async function deleteCalendarEventAPI(id: string): Promise<void> {
  await apiDelete(`/calendar/events/${id}`);
}

export async function resetCalendarEvents(): Promise<CalendarEvent[]> {
  const res = await apiPost<{ data: CalendarEvent[] }>("/calendar/events/reset", {});
  return res.data;
}

export async function fetchCalendarConfig(): Promise<CalendarConfig> {
  try {
    const res = await apiGet<{ data: CalendarConfig }>("/calendar/config");
    return res.data;
  } catch (error) {
    console.warn('API unavailable for fetchCalendarConfig:', error);
    return {
      id: "default",
      title: "Economic Calendar",
      titleId: "Kalender Ekonomi",
      subtitle: "",
      subtitleId: "",
      impactFilter: ["low", "medium", "high"],
      regionFilter: "all",
      categoryFilter: "all",
      defaultDays: 7,
      showTimezone: true,
      showActual: true,
      showPrevious: true,
      showConsensus: true,
      showForecast: true,
      createdAt: "",
      updatedAt: "",
    };
  }
}

export async function updateCalendarConfig(
  data: Partial<Omit<CalendarConfig, "id" | "createdAt" | "updatedAt">>
): Promise<CalendarConfig> {
  const res = await apiPut<{ data: CalendarConfig }>("/calendar/config", data);
  return res.data;
}

// ─── Calendar Hooks ─────────────────────────────────────────────────────────────

export function useCalendarEvents(params?: Parameters<typeof fetchCalendarEvents>[0]) {
  return useQuery({
    queryKey: ["calendar-events", params ?? {}] as const,
    queryFn: () => fetchCalendarEvents(params),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCalendarConfig() {
  return useQuery({
    queryKey: ["calendar-config"] as const,
    queryFn: fetchCalendarConfig,
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCalendarEvent>[1] }) =>
      updateCalendarEvent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCalendarEventAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useResetCalendarEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetCalendarEvents,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useUpdateCalendarConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCalendarConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-config"] });
    },
  });
}
