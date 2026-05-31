// AndaraLab Database Schema
// ORM: Drizzle ORM (DB-agnostic — swap driver for PostgreSQL/SQLite/MySQL in production)

import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  serial,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Chart Dataset Table ──────────────────────────────────────────────────────
//
// Core entity: a named time-series dataset that renders as a chart.
// Each row is a JSONB array of { period, value, ... } objects.
//
// Rationale for JSONB rows:
// - Columns are dynamic per dataset (some have 2, some have 5 series)
// - Row count varies widely (8 quarters vs 28 years)
// - Schema evolution is frictionless — no migrations needed for new series
// - Drizzle JSONB operators ($contains, $eq, etc.) enable future filtering
//   without deserializing in application code.
//
// Trade-off: PostgreSQL JSONB is ~10-20% slower than typed columns at scale.
// For AndaraLab's data volumes (< 100K rows), this is negligible.

export const chartDatasetsTable = pgTable(
  "chart_datasets",
  {
    // ── Identity
    id: varchar("id", { length: 64 })
      .primaryKey()
      .$defaultFn(() => `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),

    // ── Content
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    // ── Classification
    category: varchar("category", { length: 128 }).notNull().default("Macro Foundations"),
    chartType: varchar("chart_type", { length: 16 }).notNull().default("line"), // line | bar | area

    // ── Visual config (CMS-editable chart labels)
    color: varchar("color", { length: 16 }).notNull().default("#1a3a5c"), // hex, primary series
    unit: varchar("unit", { length: 64 }).notNull().default(""),
    chartTitle: varchar("chart_title", { length: 255 }),   // Override display title on chart
    xAxisLabel: varchar("x_axis_label", { length: 128 }),   // X-axis label
    yAxisLabel: varchar("y_axis_label", { length: 128 }),   // Y-axis label
    subtitle: text("subtitle"),                              // Optional subheading below chart

    // ── Dynamic schema
    // columns: array of series names, e.g. ["Tahun", "Minyak & Kondensat", "Gas Alam"]
    // rows: array of records keyed by column names
    //   e.g. [{ "Tahun": "1996", "Minyak & Kondensat": 548648.3, "Gas Alam": 3164016.2 }]
    columns: jsonb("columns").$type<string[]>().notNull(),
    rows: jsonb("rows").$type<Record<string, string | number>[]>().notNull().default([]),

    // ── Audit trail
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    // Index on category for filtered list queries (O(log n) vs O(n) scan)
    index("idx_chart_datasets_category").on(table.category),
    // Index on updatedAt for "recent first" ordering
    index("idx_chart_datasets_updated_at").on(table.updatedAt),
  ]
);

// ─── Article Table ───────────────────────────────────────────────────────────
//
// For blog posts, research notes, and static editorial content.
// Slug-based routing. Body is an array of rich-text blocks (paragraphs).
//
// Note: Currently used as static data in articles.ts.
// This schema is the target for future headless-CMS migration.

export const articlesTable = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt"),
    tag: varchar("tag", { length: 64 }),
    category: varchar("category", { length: 128 }),
    categoryHref: varchar("category_href", { length: 255 }),
    image: varchar("image", { length: 512 }),
    readTime: varchar("read_time", { length: 16 }),

    // Body is an array of paragraphs, matching the existing static shape
    body: jsonb("body").$type<string[]>().notNull().default([]),

    publishedAt: timestamp("published_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_articles_slug").on(table.slug),
    index("idx_articles_category").on(table.category),
  ]
);

// ─── Content Section Types ─────────────────────────────────────────────────────
//
// Used by the pages table. Each page is composed of typed content sections.
// Supported section types:
//   text      — rich text paragraph block
//   hero      — full-width hero banner (title, subtitle, CTA)
//   stats     — key metric cards
//   featured  — featured article cards
//   posts     — article grid filtered by category (from CMS)
//   chart     — inline chart card
//   cta       — call to action strip
//   divider   — visual separator

export type ContentSection =
  | { type: "text";      content: string }
  | { type: "hero";      headline: string; subheadline?: string; ctaText?: string; ctaHref?: string }
  | { type: "stats";     items: { label: string; value: string; unit?: string }[] }
  | { type: "featured";  slugs: string[]; limit?: number }
  | { type: "posts";     categories: string[]; title?: string }
  | { type: "chart";     datasetId: string; title?: string }
  | { type: "cta";       heading: string; body: string; buttonText: string; buttonHref: string }
  | { type: "divider" };

// ─── Pages Table ─────────────────────────────────────────────────────────────
//
// CMS-managed pages with full multi-language support.
// Each language version is a separate row; the `linkedId` field pairs EN↔ID.
//
// Slug is the URL path — e.g. "/macro/macro-outlooks"
// Content is a JSON array of typed section blocks (see ContentSection above).
//
// Status workflow:
//   draft     — visible only in CMS preview, not on public site
//   published — live on the site

export const pagesTable = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),

    // ── Identity & routing
    slug:        varchar("slug", { length: 255 }).notNull(),
    locale:      varchar("locale", { length: 2 }).notNull().default("en"), // "en" | "id"
    status:      varchar("status", { length: 16 }).notNull().default("draft"), // "draft" | "published"

    // ── Core content
    title:       varchar("title", { length: 255 }).notNull(),
    description: text("description"), // SEO / meta description
    content:     jsonb("content").$type<ContentSection[]>().notNull().default([]),

    // ── Multi-language pairing
    // Points to the ID of the paired language version (EN↔ID).
    // Null for the first version created; set when the pair is established.
    linkedId:    varchar("linked_id", { length: 64 }),

    // ── Navigation metadata (used by navbar / breadcrumb)
    navLabel:    varchar("nav_label", { length: 64 }), // e.g. "Macro Outlooks"
    section:     varchar("section", { length: 64 }),   // e.g. "Macro Foundations"

    // ── Audit
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_pages_slug").on(table.slug),
    index("idx_pages_locale").on(table.locale),
    index("idx_pages_status").on(table.status),
    index("idx_pages_linked").on(table.linkedId),
  ]
);

// ─── Blog Posts Table ───────────────────────────────────────────────────────
//
// Independent blog posts managed entirely via CMS.
// Not tied to static articles.ts — this is the live, editable blog layer.

export const blogPostsTable = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),

    // ── Identity & routing
    slug:        varchar("slug", { length: 255 }).notNull(),
    locale:      varchar("locale", { length: 2 }).notNull().default("en"), // "en" | "id"
    status:      varchar("status", { length: 16 }).notNull().default("draft"),

    // ── Core content
    title:       varchar("title", { length: 255 }).notNull(),
    excerpt:     text("excerpt"),
    body:        jsonb("body").$type<string[]>().notNull().default([]), // array of paragraphs

    // ── Classification
    category:    varchar("category", { length: 64 }).notNull(), // e.g. "economics-101", "market-pulse", "lab-notes"
    tag:         varchar("tag", { length: 64 }),
    image:       varchar("image", { length: 512 }),
    readTime:    varchar("read_time", { length: 16 }),

    // ── Multi-language pairing (same as pages)
    linkedId:    varchar("linked_id", { length: 64 }),

    // ── Publishing
    publishedAt: timestamp("published_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_blog_slug").on(table.slug),
    index("idx_blog_locale").on(table.locale),
    index("idx_blog_status").on(table.status),
    index("idx_blog_category").on(table.category),
  ]
);

// ─── Insert Schemas (Zod) ─────────────────────────────────────────────────────
//
// Used for: API request body validation, form validation in AdminPage,
// API client type generation (via Orval + OpenAPI spec).
//
// .omit({ id, createdAt, updatedAt }) — server generates these.

export const insertChartDatasetSchema = createInsertSchema(chartDatasetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageSchema = createInsertSchema(pagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPostsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Partial / Patch Schemas ──────────────────────────────────────────────────
//
// Used for PUT (full replace) and PATCH (partial update) endpoints.

export const updateChartDatasetSchema = insertChartDatasetSchema.partial();
export const updateArticleSchema = insertArticleSchema.partial();
export const updatePageSchema = insertPageSchema.partial();
export const updateBlogPostSchema = insertBlogPostSchema.partial();

// ─── Domain Types ─────────────────────────────────────────────────────────────
//
// Exported for use throughout the monorepo without importing from ORM layer.

export type InsertChartDataset = z.infer<typeof insertChartDatasetSchema>;
export type UpdateChartDataset = z.infer<typeof updateChartDatasetSchema>;
export type ChartDataset = typeof chartDatasetsTable.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;

export type InsertPage = z.infer<typeof insertPageSchema>;
export type UpdatePage = z.infer<typeof updatePageSchema>;
export type Page = typeof pagesTable.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;
export type BlogPost = typeof blogPostsTable.$inferSelect;
