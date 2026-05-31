// Featured Insights API Routes — /api/featured-insights
// GET locale config, PUT update config

import { Router, type Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { featuredInsightsStore } from "../lib/store.js";

function problem(res: Response, status: number, title: string, detail?: string) {
  res.status(status).json({ type: `https://andarlab.io/errors/${status}`, title, status, detail });
}

function paramStr(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

const updateSchema = z.object({
  slugs: z.array(z.object({
    slug: z.string(),
    label: z.string().optional().default(""),
    order: z.number(),
  })).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  sectionLabel: z.string().optional(),
  limit: z.number().optional(),
  showOnHomepage: z.boolean().optional(),
});

const router = Router();

router.post("/reset", (_req: Request, res: Response) => {
  featuredInsightsStore.reset();
  res.json({ meta: { reset: true } });
});

router.get("/:locale", (req: Request, res: Response) => {
  const locale = paramStr(req, "locale") as "en" | "id";
  if (locale !== "en" && locale !== "id") {
    return problem(res, 400, "Invalid locale", "Locale must be 'en' or 'id'");
  }
  const config = featuredInsightsStore.get(locale);
  if (!config) return problem(res, 404, "Not Found", `Featured insights for locale '${locale}' not found`);
  res.json({ data: config });
});

router.put("/:locale", (req: Request, res: Response) => {
  const locale = paramStr(req, "locale") as "en" | "id";
  if (locale !== "en" && locale !== "id") {
    return problem(res, 400, "Invalid locale", "Locale must be 'en' or 'id'");
  }
  const result = updateSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const id = `featured-${locale}`;
  const updated = featuredInsightsStore.update(id, result.data);
  if (!updated) return problem(res, 404, "Not Found", `Featured insights '${id}' not found`);
  res.json({ data: updated, meta: { updated: true } });
});

export default router;
