// Calendar API Routes — /api/calendar/events and /api/calendar/config
// Full CRUD: GET (list/one), POST (create), PUT (update), DELETE, POST (reset)

import { Router, type Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { calendarEventStore, calendarConfigStore, type CalendarImpact, type CalendarRegion } from "../lib/store.js";

const createEventSchema = z.object({
  date:         z.string().min(1),
  time:         z.string().optional().default("08:00"),
  countryCode:  z.string().min(1).max(5),
  countryLabel: z.string().min(1),
  eventName:    z.string().min(1),
  eventNameId:  z.string().optional(),
  impact:       z.enum(["low", "medium", "high"]).default("medium"),
  actual:       z.string().optional(),
  previous:     z.string().optional(),
  consensus:    z.string().optional(),
  forecast:     z.string().optional(),
  category:     z.string().optional().default("Interest Rate"),
  region:       z.enum(["all", "major", "america", "europe", "asia", "africa"]).default("all"),
  enabled:      z.boolean().optional().default(true),
  order:        z.number().optional().default(99),
});

const updateEventSchema = createEventSchema.partial();

function problem(res: Response, status: number, title: string, detail?: string) {
  res.status(status).json({ type: `https://andarlab.io/errors/${status}`, title, status, detail });
}

function paramStr(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

const router = Router({ mergeParams: true });

// ─── Events ────────────────────────────────────────────────────────────────────

router.post("/reset", (_req: Request, res: Response) => {
  calendarEventStore.reset();
  res.json({ data: calendarEventStore.list(), meta: { total: calendarEventStore.list().length, reset: true } });
});

router.get("/", (req: Request, res: Response) => {
  const filter: {
    days?: number;
    impact?: CalendarImpact[];
    region?: CalendarRegion;
    category?: string;
    country?: string;
  } = {};

  const rawDays = req.query.days;
  if (rawDays && !Array.isArray(rawDays)) {
    const days = parseInt(String(rawDays));
    if (!isNaN(days) && days > 0) {
      const today = new Date();
      const target = new Date(today.getTime() + days * 86400000);
      filter.days = days;
      // We filter in-memory based on date range
    }
  }

  if (req.query.impact && !Array.isArray(req.query.impact)) {
    filter.impact = String(req.query.impact).split(",").filter(Boolean) as CalendarImpact[];
  }
  if (req.query.region && !Array.isArray(req.query.region)) {
    filter.region = String(req.query.region) as CalendarRegion;
  }
  if (req.query.category && !Array.isArray(req.query.category)) {
    filter.category = String(req.query.category);
  }
  if (req.query.country && !Array.isArray(req.query.country)) {
    filter.country = String(req.query.country);
  }

  let data = calendarEventStore.list(filter);

  // Filter by date range if days param provided
  const daysParam = req.query.days;
  if (daysParam && !Array.isArray(daysParam)) {
    const days = parseInt(String(daysParam));
    if (!isNaN(days) && days > 0) {
      const today = new Date().toISOString().split("T")[0];
      const future = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
      data = data.filter((e) => e.date >= today && e.date <= future);
    }
  }

  res.json({ data, meta: { total: data.length } });
});

router.post("/", (req: Request, res: Response) => {
  const result = createEventSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const ev = calendarEventStore.create(result.data);
  res.status(201).json({ data: ev, meta: { created: true } });
});

router.get("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const ev = calendarEventStore.get(id);
  if (!ev) return problem(res, 404, "Not Found", `Calendar event '${id}' does not exist`);
  res.json({ data: ev });
});

router.put("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  const result = updateEventSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const updated = calendarEventStore.update(id, result.data);
  if (!updated) return problem(res, 404, "Not Found", `Calendar event '${id}' does not exist`);
  res.json({ data: updated, meta: { updated: true } });
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = paramStr(req, "id");
  if (!calendarEventStore.delete(id)) return problem(res, 404, "Not Found", `Calendar event '${id}' does not exist`);
  res.status(204).end();
});

export default router;