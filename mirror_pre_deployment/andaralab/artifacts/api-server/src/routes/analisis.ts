// Analisis Deskriptif API Routes — /api/analisis
// CRUD for customizable descriptive analysis sections

import { Router, type Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { analisisStore } from "../lib/store.js";

// ─── Zod validation ─────────────────────────────────────────────────────────────

const analysisSectionSchema: z.ZodType<import("../lib/store.js").AnalysisSection> = z.object({
  id: z.string(),
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  locale: z.enum(["en", "id", "both"]),
  sectionType: z.enum(["overview", "dataset-breakdown", "blog-insights", "custom"]),
  order: z.number(),
  widgets: z.array(z.any()),
  createdAt: z.string().optional().default(() => new Date().toISOString()),
  updatedAt: z.string().optional().default(() => new Date().toISOString()),
});

const createAnalisisSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().optional().default(""),
  description: z.string().optional().default(""),
  descriptionEn: z.string().optional().default(""),
  locale: z.enum(["en", "id", "both"]).default("both"),
  status: z.enum(["active", "archived"]).default("active"),
  sections: z.array(analysisSectionSchema).default([]),
  linkedId: z.string().optional(),
});

const updateAnalisisSchema = createAnalisisSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Request body cannot be empty" }
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

function problem(res: Response, status: number, title: string, detail?: string) {
  res.status(status).json({ type: `https://andarlab.io/errors/${status}`, title, status, detail });
}

function queryStr(req: Request, name: string): string | undefined {
  const v = req.query[name];
  return typeof v === "string" ? v : undefined;
}

function paramStr(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

router.post("/reset", (_req: Request, res: Response) => {
  analisisStore.reset();
  res.json({ data: analisisStore.list(), meta: { total: analisisStore.list().length, reset: true } });
});

router.get("/", (req: Request, res: Response) => {
  const status = queryStr(req, "status");
  const locale = queryStr(req, "locale");
  const data = analisisStore.list(
    status ? { status } : undefined
  );
  res.json({ data, meta: { total: data.length, status: status ?? "all" } });
});

router.post("/", (req: Request, res: Response) => {
  const result = createAnalisisSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const record = analisisStore.create(result.data);
  res.status(201).json({ data: record, meta: { created: true } });
});

router.post("/bulk", (req: Request, res: Response) => {
  if (!Array.isArray(req.body)) return problem(res, 400, "Invalid Data", "Body must be an array");
  const records = analisisStore.bulkCreate(req.body);
  res.status(201).json({ data: records, meta: { total: records.length, created: true } });
});

router.get("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const record = analisisStore.get(id);
  if (!record) return problem(res, 404, "Not Found", `Analisis '${id}' does not exist`);
  res.json({ data: record });
});

router.put("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const result = updateAnalisisSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const updated = analisisStore.update(id, result.data);
  if (!updated) return problem(res, 404, "Not Found", `Analisis '${id}' does not exist`);
  res.json({ data: updated, meta: { updated: true } });
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  if (!analisisStore.delete(id)) return problem(res, 404, "Not Found", `Analisis '${id}' does not exist`);
  res.status(204).end();
});

export default router;
