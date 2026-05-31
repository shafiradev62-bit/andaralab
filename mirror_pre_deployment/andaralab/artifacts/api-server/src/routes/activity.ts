// Activity Log Routes — /api/activity
// GET  /api/activity          — list recent entries (supports ?limit=, ?resource=, ?action=)
// GET  /api/activity/export   — download full log as JSON
// DELETE /api/activity        — clear all entries (admin only)

import { Router } from "express";
import type { Request, Response } from "express";
import { activityLogStore } from "../lib/store.js";
import type { ActivityResource, ActivityAction } from "../lib/store.js";

const router = Router();

router.get("/export", (_req: Request, res: Response) => {
  const json = activityLogStore.export();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="activity-log-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(json);
});

router.get("/", (req: Request, res: Response) => {
  const limit    = Math.min(parseInt(String(req.query.limit ?? "200"), 10) || 200, 2000);
  const resource = req.query.resource as ActivityResource | undefined;
  const action   = req.query.action   as ActivityAction   | undefined;

  const data = activityLogStore.list(limit, {
    resource: resource || undefined,
    action:   action   || undefined,
  });

  res.json({
    data,
    meta: {
      total:    data.length,
      limit,
      resource: resource ?? "all",
      action:   action   ?? "all",
    },
  });
});

router.delete("/", (_req: Request, res: Response) => {
  activityLogStore.clear();
  res.status(204).end();
});

export default router;
