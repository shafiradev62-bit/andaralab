// Dataset API Routes — /api/datasets
// Full CRUD: GET (list/one), POST (create), PUT (update), DELETE, POST (reset)

import { Router, type Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { datasetStore } from "../lib/store.js";

// ─── Zod validation ─────────────────────────────────────────────────────────────

const createDatasetSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional().default(""),
  category:   z.string().min(1),
  chartType:  z.enum(["line", "bar", "area", "combo"]),
  color:      z.string().default("#1a3a5c"),
  unit:       z.string().default(""),
  unitType:   z.enum(["percent", "currency_idr", "currency_usd", "number", "custom"]).default("number"),
  chartTitle: z.string().optional(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  subtitle:   z.string().optional(),
  columns:    z.array(z.string()).min(1),
  columnNames: z.record(z.enum(["en", "id"]), z.array(z.string())).optional(),
  rows:       z.array(z.record(z.union([z.string(), z.number()]))).default([]),
});

const updateDatasetSchema = createDatasetSchema.partial().refine(
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

router.get("/categories", (_req: Request, res: Response) => {
  res.json({ data: datasetStore.categories() });
});

router.post("/reset", (_req: Request, res: Response) => {
  datasetStore.reset();
  res.json({ data: datasetStore.list(), meta: { total: datasetStore.list().length, reset: true } });
});

router.get("/", (req: Request, res: Response) => {
  const category = queryStr(req, "category");
  const data = datasetStore.list(category ? { category } : undefined);
  res.json({ data, meta: { total: data.length, category: category ?? "all" } });
});

router.post("/", (req: Request, res: Response) => {
  const result = createDatasetSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const ds = datasetStore.create(result.data);
  res.status(201).json({ data: ds, meta: { created: true } });
});

router.post("/bulk", (req: Request, res: Response) => {
  if (!Array.isArray(req.body)) return problem(res, 400, "Validation Error", "Body must be an array of datasets");
  const parsed = z.array(createDatasetSchema).safeParse(req.body);
  if (!parsed.success) return problem(res, 400, "Validation Error", parsed.error.message);
  const items = datasetStore.bulkCreate(parsed.data);
  res.status(201).json({ data: items, meta: { created: true, count: items.length } });
});

router.get("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const ds = datasetStore.get(id);
  if (!ds) return problem(res, 404, "Not Found", `Dataset '${id}' does not exist`);
  res.json({ data: ds });
});

router.put("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const result = updateDatasetSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const updated = datasetStore.update(id, result.data);
  if (!updated) return problem(res, 404, "Not Found", `Dataset '${id}' does not exist`);
  res.json({ data: updated, meta: { updated: true } });
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  if (!datasetStore.delete(id)) return problem(res, 404, "Not Found", `Dataset '${id}' does not exist`);
  res.status(204).end();
});

export default router;
