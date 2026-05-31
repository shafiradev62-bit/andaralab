// Calendar Config API Route — /api/calendar/config
// GET (read), PUT (update)

import { Router, type Response } from "express";
import type { Request } from "express";
import { calendarConfigStore } from "../lib/store.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ data: calendarConfigStore.get() });
});

router.put("/", (req: Request, res: Response) => {
  const allowed: string[] = [
    "title", "titleId", "subtitle", "subtitleId",
    "impactFilter", "regionFilter", "categoryFilter",
    "defaultDays", "showTimezone", "showActual", "showPrevious",
    "showConsensus", "showForecast",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = (req.body as Record<string, unknown>)[key];
  }
  const updated = calendarConfigStore.update(updates);
  res.json({ data: updated, meta: { updated: true } });
});

export default router;