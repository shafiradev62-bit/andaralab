// Activity Log Routes — /api/activity
import { Router } from "express";
import type { Request, Response } from "express";
import { activityLogStore } from "../lib/store.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 500);
  res.json({ data: activityLogStore.list(limit) });
});

router.delete("/", (_req: Request, res: Response) => {
  activityLogStore.clear();
  res.status(204).end();
});

export default router;
