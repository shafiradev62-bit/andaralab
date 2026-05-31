// Pages API Routes
// Resource: /api/pages — CRUD for CMS-managed pages with EN/ID support.

import { Router, type Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { pageStore } from "../lib/store.js";

// ─── Zod validation ─────────────────────────────────────────────────────────────

const contentSectionSchema: z.ZodType<import("../lib/seed-data.js").ContentSection> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"),     content: z.string() }),
    z.object({ type: z.literal("hero"),    headline: z.string(), subheadline: z.string().optional(), ctaText: z.string().optional(), ctaHref: z.string().optional() }),
    z.object({ type: z.literal("stats"),   items: z.array(z.object({ label: z.string(), value: z.string(), unit: z.string().optional() })) }),
    z.object({ type: z.literal("featured"), slugs: z.array(z.string()), limit: z.number().optional() }),
    z.object({ type: z.literal("posts"), categories: z.array(z.string()), title: z.string().optional() }),
    z.object({ type: z.literal("chart"),   datasetId: z.string(), title: z.string().optional() }),
    z.object({ type: z.literal("cta"),    heading: z.string(), body: z.string(), buttonText: z.string(), buttonHref: z.string() }),
    z.object({ type: z.literal("divider") }),
  ])
);

const createPageSchema = z.object({
  slug:        z.string().min(1),
  locale:      z.enum(["en", "id"]),
  status:      z.enum(["draft", "published"]),
  title:       z.string().min(1),
  description: z.string().optional(),
  content:     z.array(contentSectionSchema).optional().default([]),
  linkedId:    z.string().optional(),
  navLabel:    z.string().optional(),
  section:     z.string().optional(),
});

const updatePageSchema = createPageSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Request body cannot be empty" }
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

function problem(res: Response, status: number, title: string, detail?: string) {
  res.status(status).json({ type: `https://andarlab.io/errors/${status}`, title, status, detail });
}

function paramStr(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

function paramInt(req: Request, name: string): number | null {
  const v = paramStr(req, name);
  return v ? parseInt(v, 10) : null;
}

function queryStr(req: Request, name: string): string | undefined {
  const v = req.query[name];
  return typeof v === "string" ? v : undefined;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const locale  = queryStr(req, "locale");
  const status  = queryStr(req, "status");
  const section = queryStr(req, "section");
  const data = pageStore.list({ locale, status, section });
  res.json({ data, meta: { total: data.length, locale: locale ?? "all", status: status ?? "all" } });
});

router.post("/", (req: Request, res: Response) => {
  const result = createPageSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const page = pageStore.create(result.data);
  res.status(201).json({ data: page, meta: { created: true } });
});

router.post("/reset", (_req: Request, res: Response) => {
  pageStore.reset();
  res.json({ data: pageStore.list(), meta: { total: pageStore.list().length, reset: true } });
});

router.post("/link", (req: Request, res: Response) => {
  const { idA, idB } = req.body as { idA: number; idB: number };
  if (!idA || !idB) return problem(res, 400, "Bad Request", "idA and idB are required");
  if (!pageStore.get(idA) || !pageStore.get(idB)) return problem(res, 404, "Not Found", "One or both page IDs not found");
  pageStore.linkPages(idA, idB);
  res.json({ data: { idA, idB, linked: true }, meta: { linked: true } });
});

function sendPublicPageBySlug(res: Response, slugParam: string, pathLabel: string, locale?: string) {
  const page = pageStore.getBySlugPublic(slugParam, locale);
  if (page) {
    return res.json({ data: { ...page, linkedIdRecord: pageStore.getLinked(page.id) ?? null } });
  }
  const any = pageStore.getBySlug(slugParam, locale);
  if (any?.status === "draft") {
    return problem(
      res,
      404,
      "Not Found",
      "This URL exists in the CMS but is still a draft. In Admin → Pages, open the page, choose Published (live), then Save."
    );
  }
  return problem(res, 404, "Not Found", `No page found for ${pathLabel}`);
}

router.get("/slug/:slug", (req: Request, res: Response) => {
  const locale = queryStr(req, "locale");
  return sendPublicPageBySlug(res, paramStr(req, "slug"), `slug '${req.params.slug}'`, locale);
});

/** Resolve page by full path without encoding "/" in the URL path (avoids reverse-proxy issues with %2F). */
router.get("/lookup", (req: Request, res: Response) => {
  const pathRaw = queryStr(req, "path");
  const locale = queryStr(req, "locale");
  if (!pathRaw) return problem(res, 400, "Bad Request", "Query parameter 'path' is required (e.g. /macro)");
  return sendPublicPageBySlug(res, pathRaw, `path '${pathRaw}'`, locale);
});

router.get("/:id", (req: Request, res: Response) => {
  const id = paramInt(req, "id");
  if (id === null) return problem(res, 400, "Bad Request", "Page ID must be a number");
  const page = pageStore.get(id);
  if (!page) return problem(res, 404, "Not Found", `Page with ID '${id}' does not exist`);
  res.json({ data: { ...page, linkedIdRecord: pageStore.getLinked(id) ?? null } });
});

router.put("/:id", (req: Request, res: Response) => {
  const id = paramInt(req, "id");
  if (id === null) return problem(res, 400, "Bad Request", "Page ID must be a number");
  const result = updatePageSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const updated = pageStore.update(id, result.data);
  if (!updated) return problem(res, 404, "Not Found", `Page with ID '${id}' does not exist`);
  res.json({ data: updated, meta: { updated: true } });
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = paramInt(req, "id");
  if (id === null) return problem(res, 400, "Bad Request", "Page ID must be a number");
  if (!pageStore.delete(id)) return problem(res, 404, "Not Found", `Page with ID '${id}' does not exist`);
  res.status(204).end();
});

export default router;
