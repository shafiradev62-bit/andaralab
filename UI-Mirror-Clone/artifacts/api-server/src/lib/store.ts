// Persistent file-based data store
//
// Data is saved to /data/*.json on disk so it survives container restarts.
// Falls back to seed data on first run or if files are missing/corrupt.

import fs from "fs";
import path from "path";
import {
  SEED_DATASETS,
  SEED_PAGES,
  SEED_BLOG_POSTS,
  type SeedDataset,
  type SeedPage,
  type SeedBlogPost,
} from "./seed-data.js";

// ─── Analisis Deskriptif Types ────────────────────────────────────────────────

export type AnalysisWidgetType =
  | "metric-card"    // Single KPI with value + trend
  | "comparison"     // Side-by-side comparison table
  | "bar-chart"      // Horizontal bar chart
  | "donut-chart"    // Donut/ring chart for distribution
  | "trend-line"     // Trend indicator (↑ ↓ →)
  | "highlight"      // Key insight callout box
  | "distribution"   // Distribution breakdown list
  | "custom-text";   // Free-form rich text

export interface AnalysisMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string; // e.g. "+2.3%", "-1.1%"
  note?: string;
  color?: string; // for badge/bar coloring
}

export interface AnalysisInsight {
  id: string;
  icon?: string;
  heading: string;
  body: string;
  importance: "high" | "medium" | "low";
  tags?: string[];
}

export interface AnalysisWidget {
  id: string;
  type: AnalysisWidgetType;
  title?: string;
  subtitle?: string;
  // For metric-card
  metrics?: AnalysisMetric[];
  // For comparison
  compareItems?: { label: string; values: string[] }[];
  compareHeaders?: string[];
  // For bar-chart / donut-chart
  barData?: { label: string; value: number; color?: string }[];
  // For distribution
  distributionItems?: { label: string; value: number; percentage: number; color?: string }[];
  // For highlight / custom-text
  text?: string;
  // For highlight
  calloutColor?: string;
  // For custom-text
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

export interface AnalisisDeskriptifRecord {
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

export type { SeedDataset as Dataset };

// ─── Record Types ─────────────────────────────────────────────────────────────

export interface PageRecord extends SeedPage {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostRecord extends SeedBlogPost {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function cloneDeep<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function now() {
  return new Date().toISOString();
}

function nextId(map: Map<number, unknown>): number {
  return map.size === 0 ? 1 : Math.max(...[...map.keys()]) + 1;
}

// ─── File persistence helpers ─────────────────────────────────────────────────

const DATA_DIR = process.env.DATA_DIR || "/data";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, "utf-8");
      return JSON.parse(raw) as T;
    }
  } catch {
    console.warn(`[store] Failed to read ${filepath}, using fallback`);
  }
  return fallback;
}

function writeJson<T>(filename: string, data: T): void {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`[store] Failed to write ${filepath}:`, e);
  }
}

// ─── Dataset Store ─────────────────────────────────────────────────────────────

export interface DatasetStore {
  list(filter?: { category?: string }): SeedDataset[];
  get(id: string): SeedDataset | undefined;
  create(data: Omit<SeedDataset, "id" | "createdAt" | "updatedAt">): SeedDataset;
  update(id: string, data: Partial<Omit<SeedDataset, "id" | "createdAt" | "updatedAt">>): SeedDataset | null;
  delete(id: string): boolean;
  bulkCreate(items: Omit<SeedDataset, "id" | "createdAt" | "updatedAt">[]): SeedDataset[];
  reset(): void;
  categories(): string[];
}

class PersistentDatasetStore implements DatasetStore {
  private datasets: Map<string, SeedDataset>;
  private readonly FILE = "datasets.json";

  constructor() {
    this.datasets = new Map();
    this.load();
  }

  private load() {
    const saved = readJson<SeedDataset[]>(this.FILE, []);
    if (saved.length > 0) {
      this.datasets = new Map(saved.map((d) => [d.id, d]));
    } else {
      this.seed();
    }
  }

  private save() {
    writeJson(this.FILE, [...this.datasets.values()]);
  }

  private seed() {
    this.datasets.clear();
    for (const ds of SEED_DATASETS) {
      this.datasets.set(ds.id, cloneDeep(ds));
    }
    this.save();
  }

  list(filter?: { category?: string }): SeedDataset[] {
    const all = [...this.datasets.values()];
    if (filter?.category) return all.filter((d) => d.category === filter.category);
    return all;
  }

  get(id: string): SeedDataset | undefined { return this.datasets.get(id); }

  create(data: Omit<SeedDataset, "id" | "createdAt" | "updatedAt">): SeedDataset {
    const id = `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: SeedDataset = { ...cloneDeep(data), id, createdAt: now(), updatedAt: now() };
    this.datasets.set(id, record);
    this.save();
    return record;
  }

  update(id: string, data: Partial<Omit<SeedDataset, "id" | "createdAt" | "updatedAt">>): SeedDataset | null {
    const existing = this.datasets.get(id);
    if (!existing) return null;
    const updated: SeedDataset = { ...existing, ...cloneDeep(data), updatedAt: now() };
    this.datasets.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const result = this.datasets.delete(id);
    if (result) this.save();
    return result;
  }

  bulkCreate(items: Omit<SeedDataset, "id" | "createdAt" | "updatedAt">[]): SeedDataset[] {
    const records: SeedDataset[] = [];
    for (const data of items) {
      const id = `ds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const record: SeedDataset = { ...cloneDeep(data), id, createdAt: now(), updatedAt: now() };
      this.datasets.set(id, record);
      records.push(record);
    }
    if (records.length > 0) this.save();
    return records;
  }

  reset() { this.seed(); }

  categories(): string[] {
    return [...new Set([...this.datasets.values()].map((d) => d.category))].sort();
  }
}

// ─── Page Store ────────────────────────────────────────────────────────────────

export interface PageStore {
  list(filter?: { locale?: string; status?: string; section?: string }): PageRecord[];
  get(id: number): PageRecord | undefined;
  getBySlug(slug: string, locale?: string): PageRecord | undefined;
  /** Public site: only published; prefers locale; newest updatedAt wins on duplicates. */
  getBySlugPublic(slug: string, locale?: string): PageRecord | undefined;
  getLinked(id: number): PageRecord | undefined;
  create(data: SeedPage): PageRecord;
  update(id: number, data: Partial<SeedPage>): PageRecord | null;
  delete(id: number): boolean;
  reset(): void;
  linkPages(idA: number, idB: number): void;
}

class PersistentPageStore implements PageStore {
  private pages: Map<number, PageRecord>;
  private readonly FILE = "pages.json";

  constructor() {
    this.pages = new Map();
    this.load();
  }

  private load() {
    const saved = readJson<PageRecord[]>(this.FILE, []);
    if (saved.length > 0) {
      this.pages = new Map(saved.map((p) => [p.id, p]));
    } else {
      this.seed();
    }
  }

  private save() {
    writeJson(this.FILE, [...this.pages.values()]);
  }

  private seed() {
    this.pages.clear();
    for (const p of SEED_PAGES) {
      const id = nextId(this.pages);
      this.pages.set(id, { ...cloneDeep(p), id, createdAt: now(), updatedAt: now() });
    }
    this.save();
  }

  list(filter?: { locale?: string; status?: string; section?: string }): PageRecord[] {
    let all = [...this.pages.values()];
    if (filter?.locale)  all = all.filter((p) => p.locale === filter.locale);
    if (filter?.status)  all = all.filter((p) => p.status === filter.status);
    if (filter?.section) all = all.filter((p) => p.section === filter.section);
    return all;
  }

  get(id: number): PageRecord | undefined { return this.pages.get(id); }

  getBySlug(slug: string, locale?: string): PageRecord | undefined {
    const norm = slug.startsWith("/") ? slug : "/" + slug;
    const matches = [...this.pages.values()].filter(
      (p) => p.slug === norm || p.slug === norm.replace(/^\//, "")
    );
    if (!matches.length) return undefined;
    if (locale) {
      const localized = matches.find((p) => p.locale === locale);
      if (localized) return localized;
    }
    return matches[0];
  }

  getBySlugPublic(slug: string, locale?: string): PageRecord | undefined {
    const norm = slug.startsWith("/") ? slug : "/" + slug;
    const published = [...this.pages.values()].filter(
      (p) =>
        p.status === "published" &&
        (p.slug === norm || p.slug === norm.replace(/^\//, ""))
    );
    if (!published.length) return undefined;
    const pickNewest = (rows: PageRecord[]) =>
      [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    if (locale) {
      const forLocale = published.filter((p) => p.locale === locale);
      if (forLocale.length) return pickNewest(forLocale);
    }
    return pickNewest(published);
  }

  getLinked(id: number): PageRecord | undefined {
    const page = this.pages.get(id);
    if (!page?.linkedId) return undefined;
    return this.pages.get(parseInt(page.linkedId, 10));
  }

  create(data: SeedPage): PageRecord {
    const id = nextId(this.pages);
    const record: PageRecord = { ...cloneDeep(data), id, createdAt: now(), updatedAt: now() };
    this.pages.set(id, record);
    this.save();
    return record;
  }

  update(id: number, data: Partial<SeedPage>): PageRecord | null {
    const existing = this.pages.get(id);
    if (!existing) return null;
    const updated: PageRecord = { ...existing, ...cloneDeep(data), updatedAt: now() };
    this.pages.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: number): boolean {
    const result = this.pages.delete(id);
    if (result) this.save();
    return result;
  }

  reset() { this.seed(); }

  linkPages(idA: number, idB: number): void {
    const a = this.pages.get(idA);
    const b = this.pages.get(idB);
    if (a && b) {
      this.pages.set(idA, { ...a, linkedId: String(idB), updatedAt: now() });
      this.pages.set(idB, { ...b, linkedId: String(idA), updatedAt: now() });
      this.save();
    }
  }
}

// ─── Blog Post Store ──────────────────────────────────────────────────────────

export interface BlogPostStore {
  list(filter?: { locale?: string; status?: string; category?: string }): BlogPostRecord[];
  get(id: number): BlogPostRecord | undefined;
  getBySlug(slug: string, locale?: string): BlogPostRecord | undefined;
  getBySlugPublic(slug: string, locale?: string): BlogPostRecord | undefined;
  getLinked(id: number): BlogPostRecord | undefined;
  create(data: SeedBlogPost): BlogPostRecord;
  update(id: number, data: Partial<SeedBlogPost>): BlogPostRecord | null;
  delete(id: number): boolean;
  reset(): void;
  linkPosts(idA: number, idB: number): void;
}

class PersistentBlogPostStore implements BlogPostStore {
  private posts: Map<number, BlogPostRecord>;
  private readonly FILE = "posts.json";

  constructor() {
    this.posts = new Map();
    this.load();
  }

  private load() {
    const saved = readJson<BlogPostRecord[]>(this.FILE, []);
    if (saved.length > 0) {
      this.posts = new Map(saved.map((p) => [p.id, p]));
    } else {
      this.seed();
    }
  }

  private save() {
    writeJson(this.FILE, [...this.posts.values()]);
  }

  private seed() {
    this.posts.clear();
    for (const p of SEED_BLOG_POSTS) {
      const id = nextId(this.posts);
      this.posts.set(id, { ...cloneDeep(p), id, createdAt: now(), updatedAt: now() });
    }
    this.save();
  }

  list(filter?: { locale?: string; status?: string; category?: string }): BlogPostRecord[] {
    let all = [...this.posts.values()];
    if (filter?.locale)   all = all.filter((p) => p.locale === filter.locale);
    if (filter?.status)   all = all.filter((p) => p.status === filter.status);
    if (filter?.category) all = all.filter((p) => p.category === filter.category);
    return all;
  }

  get(id: number): BlogPostRecord | undefined { return this.posts.get(id); }

  getBySlug(slug: string, locale?: string): BlogPostRecord | undefined {
    const norm = slug.startsWith("/") ? slug : "/" + slug;
    const matches = [...this.posts.values()].filter(
      (p) => p.slug === norm || p.slug === norm.replace(/^\//, "")
    );
    if (!matches.length) return undefined;
    if (locale) {
      const localized = matches.find((p) => p.locale === locale);
      if (localized) return localized;
    }
    return matches[0];
  }

  getBySlugPublic(slug: string, locale?: string): BlogPostRecord | undefined {
    // 1. Normalize input slug
    const cleanSlug = slug.trim().replace(/^\/+/g, "").replace(/\/+$/g, "");
    if (!cleanSlug) return undefined;

    console.log(`[store] Seeking public post for slug: "${cleanSlug}" (locale: ${locale || "any"})`);

    // 2. Find all matches
    const matches = [...this.posts.values()].filter(
      (p) =>
        p.status === "published" &&
        (p.slug === cleanSlug || p.slug === `/${cleanSlug}`)
    );

    if (matches.length === 0) {
      console.warn(`[store] 404: No published post matches slug "${cleanSlug}"`);
      return undefined;
    }

    console.log(`[store] Found ${matches.length} matches for "${cleanSlug}"`);

    const pickNewest = (rows: BlogPostRecord[]) =>
      [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

    // 3. Return by locale if specified
    if (locale) {
      const forLocale = matches.filter((p) => p.locale === locale);
      if (forLocale.length) {
        console.log(`[store] Returning locale match: ${locale}`);
        return pickNewest(forLocale);
      }
      console.log(`[store] No exact locale match for ${locale}, falling back to default`);
    }
    
    // 4. Default to newest match
    const result = pickNewest(matches);
    console.log(`[store] Returning post ID: ${result.id} (locale: ${result.locale})`);
    return result;
  }



  getLinked(id: number): BlogPostRecord | undefined {
    const post = this.posts.get(id);
    if (!post?.linkedId) return undefined;
    return this.posts.get(parseInt(post.linkedId, 10));
  }

  create(data: SeedBlogPost): BlogPostRecord {
    const id = nextId(this.posts);
    const record: BlogPostRecord = { ...cloneDeep(data), id, createdAt: now(), updatedAt: now() };
    this.posts.set(id, record);
    this.save();
    return record;
  }

  update(id: number, data: Partial<SeedBlogPost>): BlogPostRecord | null {
    const existing = this.posts.get(id);
    if (!existing) return null;
    const updated: BlogPostRecord = { ...existing, ...cloneDeep(data), updatedAt: now() };
    this.posts.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: number): boolean {
    const result = this.posts.delete(id);
    if (result) this.save();
    return result;
  }

  reset() { this.seed(); }

  linkPosts(idA: number, idB: number): void {
    const a = this.posts.get(idA);
    const b = this.posts.get(idB);
    if (a && b) {
      this.posts.set(idA, { ...a, linkedId: String(idB), updatedAt: now() });
      this.posts.set(idB, { ...b, linkedId: String(idA), updatedAt: now() });
      this.save();
    }
  }
}

// ─── Featured Insights Config ───────────────────────────────────────────────────

export interface FeaturedInsight {
  slug: string;     // blog post slug
  label: string;    // optional override label
  order: number;    // display order
}

export interface FeaturedInsightsConfig {
  id: string;
  locale: "en" | "id";
  // If slugs is empty, fallback to auto-select latest posts
  slugs: FeaturedInsight[];
  title: string;
  subtitle: string;
  sectionLabel: string;
  limit: number;    // how many posts to show (3 or 6)
  showOnHomepage: boolean;
  createdAt: string;
  updatedAt: string;
}

const SEED_FEATURED_INSIGHTS: FeaturedInsightsConfig[] = [
  {
    id: "featured-en",
    locale: "en",
    slugs: [
      { slug: "nickel-ev-indonesia", order: 1 },
      { slug: "digital-economy-indonesia-2026", order: 2 },
      { slug: "bank-mandatory-ratio-q1-2026", order: 3 },
    ],
    title: "Featured Insights",
    subtitle: "Latest research and analysis from AndaraLab",
    sectionLabel: "Featured Research",
    limit: 3,
    showOnHomepage: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-06",
  },
  {
    id: "featured-id",
    locale: "id",
    slugs: [
      { slug: "ri-transmigration-nickel-downstreaming", order: 1 },
      { slug: "prospeks-makro-indonesia-2026-id", order: 2 },
      { slug: "food-inflation-handling-indonesia", order: 3 },
    ],
    title: "Wawasan Pilihan",
    subtitle: "Riset dan analisis terbaru dari AndaraLab",
    sectionLabel: "Riset Pilihan",
    limit: 3,
    showOnHomepage: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-06",
  },
];

export interface FeaturedInsightsStore {
  get(locale: "en" | "id"): FeaturedInsightsConfig | undefined;
  update(id: string, data: Partial<Omit<FeaturedInsightsConfig, "id" | "createdAt" | "updatedAt">>): FeaturedInsightsConfig | null;
  reset(): void;
}

class PersistentFeaturedInsightsStore implements FeaturedInsightsStore {
  private records: Map<string, FeaturedInsightsConfig>;
  private readonly FILE = "featured-insights.json";

  constructor() {
    this.records = new Map();
    this.load();
  }

  private load() {
    const saved = readJson<FeaturedInsightsConfig[]>(this.FILE, []);
    if (saved.length > 0) {
      this.records = new Map(saved.map((r) => [r.id, r]));
    } else {
      this.seed();
    }
  }

  private save() {
    writeJson(this.FILE, [...this.records.values()]);
  }

  private seed() {
    this.records.clear();
    for (const r of SEED_FEATURED_INSIGHTS) {
      this.records.set(r.id, cloneDeep(r));
    }
    this.save();
  }

  get(locale: "en" | "id"): FeaturedInsightsConfig | undefined {
    return this.records.get(`featured-${locale}`);
  }

  update(id: string, data: Partial<Omit<FeaturedInsightsConfig, "id" | "createdAt" | "updatedAt">>): FeaturedInsightsConfig | null {
    const existing = this.records.get(id);
    if (!existing) return null;
    const updated: FeaturedInsightsConfig = { ...existing, ...cloneDeep(data), updatedAt: now() };
    this.records.set(id, updated);
    this.save();
    return updated;
  }

  reset() { this.seed(); }
}

// ─── Analisis Deskriptif Store ─────────────────────────────────────────────────

const SEED_ANALISIS: AnalisisDeskriptifRecord[] = [
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
        sectionBg: "/gambar.png",
        widgets: [
          {
            id: "w1",
            type: "metric-card",
            title: "Total Konten",
            metrics: [
              { id: "m1", label: "Datasets", value: "11", trend: "neutral", note: "11 chart datasets available" },
              { id: "m2", label: "Blog Posts", value: "14", trend: "up", trendValue: "+2 this month", note: "13 published, 1 draft" },
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
      {
        id: "s3-risk",
        title: "Analisis Risiko",
        titleEn: "Risk Analysis",
        description: "Identifikasi risiko utama sistem.",
        locale: "both",
        sectionType: "custom",
        order: 3,
        widgets: [
          {
            id: "w7",
            type: "comparison",
            title: "Risk Matrix",
            subtitle: "Dampak vs Likelihood",
            compareHeaders: ["Risiko", "Dampak", "Likelihood", "Mitigasi"],
            compareItems: [
              { label: "API Server Down", values: ["High", "Medium", "PM2 auto-restart"] },
              { label: "Data Loss (CRUD test)", values: ["High", "Low", "Reset to Default"] },
              { label: "Cross-browser Issue", values: ["Medium", "Medium", "Multi-browser test"] },
              { label: "Content Mismatch (EN/ID)", values: ["Low", "Low", "Verify toggle"] },
              { label: "Auth Security", values: ["High", "Medium", "Password protect /admin"] },
            ],
          },
          {
            id: "w8",
            type: "highlight",
            title: "Critical Action",
            calloutColor: "#1e3a5f",
            text: "Administrators harus selalu menjalankan Reset to Default setelah melakukan test CRUD. Tidak ada test autentikasi untuk panel admin — perlu implementasi password protection.",
          },
        ],
        createdAt: "2026-01-01",
        updatedAt: "2026-04-06",
      },
    ],
    createdAt: "2026-01-01",
    updatedAt: "2026-04-06",
  },
];

export interface AnalisisDeskriptifStore {
  list(filter?: { status?: string; locale?: string }): AnalisisDeskriptifRecord[];
  get(id: string): AnalisisDeskriptifRecord | undefined;
  create(data: Omit<AnalisisDeskriptifRecord, "id" | "createdAt" | "updatedAt">): AnalisisDeskriptifRecord;
  bulkCreate(items: Omit<AnalisisDeskriptifRecord, "id" | "createdAt" | "updatedAt">[]): AnalisisDeskriptifRecord[];
  update(id: string, data: Partial<Omit<AnalisisDeskriptifRecord, "id" | "createdAt" | "updatedAt">>): AnalisisDeskriptifRecord | null;
  delete(id: string): boolean;
  reset(): void;
}

class PersistentAnalisisDeskriptifStore implements AnalisisDeskriptifStore {
  private records: Map<string, AnalisisDeskriptifRecord>;
  private readonly FILE = "analisis.json";

  constructor() {
    this.records = new Map();
    this.load();
  }

  private load() {
    const saved = readJson<AnalisisDeskriptifRecord[]>(this.FILE, []);
    if (saved.length > 0) {
      this.records = new Map(saved.map((r) => [r.id, r]));
    } else {
      this.seed();
    }
  }

  private save() {
    writeJson(this.FILE, [...this.records.values()]);
  }

  private seed() {
    this.records.clear();
    for (const r of SEED_ANALISIS) {
      this.records.set(r.id, cloneDeep(r));
    }
    this.save();
  }

  list(filter?: { status?: string; locale?: string }): AnalisisDeskriptifRecord[] {
    let all = [...this.records.values()];
    if (filter?.status) all = all.filter((r) => r.status === filter.status);

    // Dynamic enrichment for the "System Overview" dashboard
    return all.map(record => {
      if (record.id === "default-overview") {
        const cloned = cloneDeep(record);
        
        // Pre-calculate all totals once
        const dsCount = datasetStore.list().length;
        const allPosts = blogPostStore.list();
        const postCount = allPosts.length;
        const pageCount = pageStore.list().length;
        const catCount = datasetStore.categories().length;
        const published = allPosts.filter(p => p.status === "published").length;
        const enPosts = allPosts.filter(p => p.locale === "en").length;
        const idPosts = allPosts.filter(p => p.locale === "id").length;

        // 1. Update Coverage Section (s1-coverage)
        const coverageSection = cloned.sections.find(s => s.id === "s1-coverage");
        if (coverageSection) {
          // Update Metric Card (w1)
          const w1 = coverageSection.widgets.find(w => w.id === "w1");
          if (w1 && w1.metrics) {
            w1.metrics = w1.metrics.map(m => {
              if (m.id === "m1") return { ...m, value: String(dsCount), note: `${dsCount} chart datasets available` };
              if (m.id === "m2") return { ...m, value: String(postCount), note: `${postCount} total posts` };
              if (m.id === "m3") return { ...m, value: String(pageCount), note: `${pageCount} pages available` };
              if (m.id === "m4") return { ...m, value: String(catCount) };
              return m;
            });
          }

          // Update Distribution (w2) - Distribution by Category
          const w2 = coverageSection.widgets.find(w => w.id === "w2");
          if (w2) {
            const allDatasets = datasetStore.list();
            const counts: Record<string, number> = {};
            allDatasets.forEach(ds => {
              counts[ds.category] = (counts[ds.category] || 0) + 1;
            });
            const total = allDatasets.length || 1;
            const palette = ["#1e3a5f", "#2a5a8c", "#0d9fbf", "#3b82f6", "#f59e0b"];
            w2.distributionItems = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value], idx) => ({
                label,
                value,
                percentage: Math.round((value / total) * 100),
                color: palette[idx % palette.length]
              }));
          }
        }

        // 2. Update Blog Section (s2-blog -> w4)
        const blogSection = cloned.sections.find(s => s.id === "s2-blog");
        if (blogSection) {
          const w4 = blogSection.widgets.find(w => w.id === "w4");
          if (w4 && w4.metrics) {
            w4.metrics = w4.metrics.map(m => {
              if (m.id === "m5") return { ...m, value: String(published), note: `${postCount - published} draft pending` };
              if (m.id === "m6") return { ...m, value: String(enPosts), trendValue: postCount > 0 ? `${Math.round((enPosts/postCount)*100)}%` : "0%" };
              if (m.id === "m7") return { ...m, value: String(idPosts), trendValue: postCount > 0 ? `${Math.round((idPosts/postCount)*100)}%` : "0%" };
              return m;
            });
          }
          
          // Update Blog Distribution (w5)
          const w5 = blogSection.widgets.find(w => w.id === "w5");
          if (w5) {
            const counts: Record<string, number> = {};
            allPosts.forEach(p => {
              counts[p.category] = (counts[p.category] || 0) + 1;
            });
            const total = allPosts.length || 1;
            const palette = ["#1e3a5f", "#2a5a8c", "#0d9fbf", "#3b82f6", "#f59e0b"];
            w5.distributionItems = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value], idx) => ({
                label,
                value,
                percentage: Math.round((value / total) * 100),
                color: palette[idx % palette.length]
              }));
          }
        }

        return cloned;
      }
      return record;
    });
  }

  get(id: string): AnalisisDeskriptifRecord | undefined { return this.records.get(id); }

  create(data: Omit<AnalisisDeskriptifRecord, "id" | "createdAt" | "updatedAt">): AnalisisDeskriptifRecord {
    const id = `analisis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: AnalisisDeskriptifRecord = { ...cloneDeep(data), id, createdAt: now(), updatedAt: now() };
    this.records.set(id, record);
    this.save();
    return record;
  }

  update(id: string, data: Partial<Omit<AnalisisDeskriptifRecord, "id" | "createdAt" | "updatedAt">>): AnalisisDeskriptifRecord | null {
    const existing = this.records.get(id);
    if (!existing) return null;
    const updated: AnalisisDeskriptifRecord = { ...existing, ...cloneDeep(data), updatedAt: now() };
    this.records.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const result = this.records.delete(id);
    if (result) this.save();
    return result;
  }

  reset() { this.seed(); }
}

// ─── Singleton exports ─────────────────────────────────────────────────────────

export const datasetStore: DatasetStore   = new PersistentDatasetStore();
export const pageStore: PageStore         = new PersistentPageStore();
export const blogPostStore: BlogPostStore = new PersistentBlogPostStore();
export const analisisStore: AnalisisDeskriptifStore = new PersistentAnalisisDeskriptifStore();
export const featuredInsightsStore: FeaturedInsightsStore = new PersistentFeaturedInsightsStore();

// ─── Exchange Rate Store ────────────────────────────────────────────────────────

export interface ExchangeRate {
  id: string;
  symbol: string;          // e.g. "IDR/USD", "EUR/USD"
  label: string;            // display name e.g. "IDR/USD"
  labelEn?: string;        // English label
  labelId?: string;         // Indonesian label
  value: string;            // current value e.g. "15,890"
  change: string;           // change string e.g. "+0.32%"
  changeValue: number;      // numeric change for direction
  up: boolean | null;       // true = up, false = down, null = unchanged
  category: "currency" | "index" | "commodity" | "bond";
  order: number;            // display order
  enabled: boolean;         // whether to show in ticker
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateStore {
  list(): ExchangeRate[];
  get(id: string): ExchangeRate | undefined;
  create(data: Omit<ExchangeRate, "id" | "createdAt" | "updatedAt">): ExchangeRate;
  update(id: string, data: Partial<Omit<ExchangeRate, "id" | "createdAt" | "updatedAt">>): ExchangeRate | null;
  delete(id: string): boolean;
  reset(): void;
  reorder(ids: string[]): void;
  beginBatch(): void;
  flush(): void;
  getPendingIds(): string[];
}

const SEED_EXCHANGE_RATES: ExchangeRate[] = [
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
    id: "eur-usd",
    symbol: "EUR/USD",
    label: "EUR/USD",
    labelEn: "EUR/USD",
    labelId: "EUR/USD",
    value: "1.1700",
    change: "-0.26%",
    changeValue: -0.26,
    up: false,
    category: "currency",
    order: 2,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
  },
  {
    id: "usd-jpy",
    symbol: "USD/JPY",
    label: "USD/JPY",
    labelEn: "USD/JPY",
    labelId: "USD/JPY",
    value: "154.82",
    change: "+0.45%",
    changeValue: 0.45,
    up: true,
    category: "currency",
    order: 3,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
  },
  {
    id: "dxy",
    symbol: "DXY",
    label: "DXY",
    labelEn: "DXY Index",
    labelId: "Indeks DXY",
    value: "102.45",
    change: "-0.22%",
    changeValue: -0.22,
    up: false,
    category: "currency",
    order: 4,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
  },
  {
    id: "usd-cny",
    symbol: "USD/CNY",
    label: "USD/CNY",
    labelEn: "USD/CNY",
    labelId: "USD/CNY",
    value: "7.2380",
    change: "+0.08%",
    changeValue: 0.08,
    up: true,
    category: "currency",
    order: 5,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
  },
  {
    id: "usd-sgd",
    symbol: "USD/SGD",
    label: "USD/SGD",
    labelEn: "USD/SGD",
    labelId: "USD/SGD",
    value: "1.3385",
    change: "+0.12%",
    changeValue: 0.12,
    up: true,
    category: "currency",
    order: 6,
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
    order: 7,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
  },
  {
    id: "sp500",
    symbol: "S&P 500",
    label: "S&P 500",
    labelEn: "S&P 500",
    labelId: "S&P 500",
    value: "6,817",
    change: "-0.11%",
    changeValue: -0.11,
    up: false,
    category: "index",
    order: 8,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
  },
  {
    id: "nikkei",
    symbol: "Nikkei",
    label: "Nikkei",
    labelEn: "Nikkei 225",
    labelId: "Nikkei 225",
    value: "41,250",
    change: "+1.12%",
    changeValue: 1.12,
    up: true,
    category: "index",
    order: 9,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
  },
  {
    id: "shanghai",
    symbol: "Shanghai",
    label: "Shanghai",
    labelEn: "Shanghai Composite",
    labelId: "Indeks Shanghai",
    value: "3,285",
    change: "+0.38%",
    changeValue: 0.38,
    up: true,
    category: "index",
    order: 10,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-13",
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
    order: 11,
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
    order: 12,
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
    order: 13,
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
    up: false,
    category: "bond",
    order: 14,
    enabled: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-04-08",
  },
];

class PersistentExchangeRateStore implements ExchangeRateStore {
  private records: Map<string, ExchangeRate>;
  private readonly FILE = "exchange-rates.json";
  private _batchMode = false;
  private _pending: Map<string, Partial<ExchangeRate>> = new Map();

  constructor() {
    this.records = new Map();
    this.load();
  }

  private load() {
    const saved = readJson<ExchangeRate[]>(this.FILE, []);
    if (saved.length > 0) {
      this.records = new Map(saved.map((r) => [r.id, r]));
    } else {
      this.seed();
    }
  }

  private save() {
    writeJson(this.FILE, [...this.records.values()]);
  }

  private seed() {
    this.records.clear();
    for (const r of SEED_EXCHANGE_RATES) {
      this.records.set(r.id, cloneDeep(r));
    }
    this.save();
  }

  list(): ExchangeRate[] {
    return [...this.records.values()].sort((a, b) => a.order - b.order);
  }

  get(id: string): ExchangeRate | undefined { return this.records.get(id); }

  create(data: Omit<ExchangeRate, "id" | "createdAt" | "updatedAt">): ExchangeRate {
    const id = `er-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: ExchangeRate = { ...cloneDeep(data), id, createdAt: now(), updatedAt: now() };
    this.records.set(id, record);
    this.save();
    return record;
  }

  update(id: string, data: Partial<Omit<ExchangeRate, "id" | "createdAt" | "updatedAt">>): ExchangeRate | null {
    const existing = this.records.get(id);
    if (!existing) return null;
    if (this._batchMode) {
      const merged = { ...cloneDeep(data) };
      const pending = this._pending.get(id) || {};
      this._pending.set(id, { ...pending, ...merged });
      return { ...existing, ...merged };
    }
    const updated: ExchangeRate = { ...existing, ...cloneDeep(data), updatedAt: now() };
    this.records.set(id, updated);
    this.save();
    return updated;
  }

  /**
   * Begin batch mode — accumulate updates in memory without disk writes.
   * Call flush() when done to persist all changes at once.
   */
  beginBatch(): void {
    this._batchMode = true;
    this._pending.clear();
  }

  /**
   * Flush all pending updates to disk (call after beginBatch).
   */
  flush(): void {
    if (this._pending.size === 0) {
      this._batchMode = false;
      return;
    }
    for (const [id, data] of this._pending) {
      const existing = this.records.get(id);
      if (!existing) continue;
      const updated: ExchangeRate = { ...existing, ...cloneDeep(data), updatedAt: now() };
      this.records.set(id, updated);
    }
    this._pending.clear();
    this._batchMode = false;
    this.save();
  }

  getPendingIds(): string[] {
    return [...this._pending.keys()];
  }

  delete(id: string): boolean {
    const result = this.records.delete(id);
    if (result) this.save();
    return result;
  }

  reset() { this.seed(); }

  reorder(ids: string[]): void {
    ids.forEach((id, idx) => {
      const record = this.records.get(id);
      if (record) {
        record.order = idx;
        record.updatedAt = now();
      }
    });
    this.save();
  }
}

export const exchangeRateStore: ExchangeRateStore = new PersistentExchangeRateStore();

// ─── Calendar Event & Config Stores ────────────────────────────────────────────

export type CalendarImpact = "low" | "medium" | "high";
export type CalendarRegion = "all" | "major" | "america" | "europe" | "asia" | "africa";

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  countryCode: string;
  countryLabel: string;
  eventName: string;
  eventNameId?: string;
  impact: CalendarImpact;
  actual?: string;
  previous?: string;
  consensus?: string;
  forecast?: string;
  category: string;
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
  defaultDays: number;
  showTimezone: boolean;
  showActual: boolean;
  showPrevious: boolean;
  showConsensus: boolean;
  showForecast: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventStore {
  list(filter?: { days?: number; impact?: CalendarImpact[]; region?: CalendarRegion; category?: string; country?: string }): CalendarEvent[];
  get(id: string): CalendarEvent | undefined;
  create(data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): CalendarEvent;
  update(id: string, data: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>): CalendarEvent | null;
  delete(id: string): boolean;
  reset(): void;
}

const SEED_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "cal-1",
    date: new Date().toISOString().split("T")[0],
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
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "cal-2",
    date: new Date().toISOString().split("T")[0],
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
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "cal-3",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
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
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "cal-4",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
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
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "cal-5",
    date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
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
    createdAt: now(),
    updatedAt: now(),
  },
];

const SEED_CALENDAR_CONFIG: CalendarConfig = {
  id: "default",
  title: "Economic Calendar",
  titleId: "Kalender Ekonomi",
  subtitle: "Track key economic releases and events",
  subtitleId: "Lacak rilis dan peristiwa ekonomi penting",
  impactFilter: ["low", "medium", "high"],
  regionFilter: "all",
  categoryFilter: "all",
  defaultDays: 7,
  showTimezone: true,
  showActual: true,
  showPrevious: true,
  showConsensus: true,
  showForecast: true,
  createdAt: now(),
  updatedAt: now(),
};

class PersistentCalendarEventStore implements CalendarEventStore {
  private records: Map<string, CalendarEvent>;
  private readonly FILE = "calendar-events.json";

  constructor() {
    this.records = new Map();
    this.load();
  }

  private load() {
    const saved = readJson<CalendarEvent[]>(this.FILE, []);
    if (saved.length > 0) {
      this.records = new Map(saved.map((e) => [e.id, e]));
    } else {
      this.seed();
    }
  }

  private save() {
    writeJson(this.FILE, [...this.records.values()]);
  }

  private seed() {
    this.records.clear();
    for (const ev of SEED_CALENDAR_EVENTS) {
      this.records.set(ev.id, cloneDeep(ev));
    }
    this.save();
  }

  list(filter?: { days?: number; impact?: CalendarImpact[]; region?: CalendarRegion; category?: string; country?: string }): CalendarEvent[] {
    let all = [...this.records.values()].filter((e) => e.enabled);

    if (filter?.impact?.length) {
      all = all.filter((e) => filter.impact!.includes(e.impact));
    }
    if (filter?.region && filter.region !== "all") {
      all = all.filter((e) => e.region === "all" || e.region === filter.region);
    }
    if (filter?.category && filter.category !== "all") {
      all = all.filter((e) => e.category === filter.category);
    }
    if (filter?.country) {
      all = all.filter((e) => e.countryCode === filter.country);
    }

    // Sort by date + time
    all.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return all;
  }

  get(id: string): CalendarEvent | undefined { return this.records.get(id); }

  create(data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): CalendarEvent {
    const id = `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: CalendarEvent = { ...cloneDeep(data), id, createdAt: now(), updatedAt: now() };
    this.records.set(id, record);
    this.save();
    return record;
  }

  update(id: string, data: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>): CalendarEvent | null {
    const existing = this.records.get(id);
    if (!existing) return null;
    const updated: CalendarEvent = { ...existing, ...cloneDeep(data), updatedAt: now() };
    this.records.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const result = this.records.delete(id);
    if (result) this.save();
    return result;
  }

  reset() { this.seed(); }
}

export interface CalendarConfigStore {
  get(): CalendarConfig;
  update(data: Partial<Omit<CalendarConfig, "id" | "createdAt" | "updatedAt">>): CalendarConfig;
}

class PersistentCalendarConfigStore implements CalendarConfigStore {
  private config: CalendarConfig;
  private readonly FILE = "calendar-config.json";

  constructor() {
    this.config = cloneDeep(SEED_CALENDAR_CONFIG);
    this.load();
  }

  private load() {
    const saved = readJson<CalendarConfig | null>(this.FILE, null);
    if (saved) this.config = { ...this.config, ...saved };
  }

  private save() {
    writeJson(this.FILE, this.config);
  }

  get(): CalendarConfig {
    return cloneDeep(this.config);
  }

  update(data: Partial<Omit<CalendarConfig, "id" | "createdAt" | "updatedAt">>): CalendarConfig {
    this.config = { ...this.config, ...cloneDeep(data), updatedAt: now() };
    this.save();
    return this.get();
  }
}

export const calendarEventStore: CalendarEventStore = new PersistentCalendarEventStore();
export const calendarConfigStore: CalendarConfigStore = new PersistentCalendarConfigStore();
