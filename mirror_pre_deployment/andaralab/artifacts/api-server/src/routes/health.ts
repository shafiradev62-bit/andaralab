import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  // Fast health check - no caching, immediate response
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Response-Time", Date.now().toString());
  
  const data = HealthCheckResponse.parse({ 
    status: "ok",
    timestamp: Date.now(),
  });
  res.json(data);
});

export default router;
