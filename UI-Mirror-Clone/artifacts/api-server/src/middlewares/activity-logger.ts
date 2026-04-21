// Middleware: auto-log all mutating API calls to activityLogStore
import type { Request, Response, NextFunction } from "express";
import { activityLogStore } from "../lib/store.js";
import type { ActivityAction, ActivityResource } from "../lib/store.js";

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function resolveResource(path: string): ActivityResource | null {
  if (path.includes("/datasets"))        return "dataset";
  if (path.includes("/pages"))           return "page";
  if (path.includes("/blog"))            return "post";
  if (path.includes("/analisis"))        return "analisis";
  if (path.includes("/featured-insights")) return "featured_insights";
  if (path.includes("/exchange-rates"))  return "exchange_rate";
  if (path.includes("/calendar/events")) return "calendar_event";
  if (path.includes("/calendar/config")) return "calendar_config";
  return null;
}

function resolveAction(method: string, path: string): ActivityAction | null {
  if (path.endsWith("/reset") && method === "POST") return "reset";
  if (path.endsWith("/bulk")  && method === "POST") return "bulk_create";
  if (method === "POST")   return "create";
  if (method === "PUT")    return "update";
  if (method === "PATCH")  return "update";
  if (method === "DELETE") return "delete";
  return null;
}

export function activityLogger(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  const resource = resolveResource(req.path);
  const action = resolveAction(method, req.path);

  if (!resource || !action) return next();

  // Capture response to get the resource id/title after it's created
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // Only log on success (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const data = body?.data;
        const resourceId = data?.id ? String(data.id) : req.params?.id ?? undefined;
        const resourceTitle =
          data?.title ?? data?.name ?? data?.symbol ?? data?.slug ?? undefined;

        activityLogStore.log({
          action,
          resource,
          resourceId,
          resourceTitle: resourceTitle ? String(resourceTitle) : undefined,
          ip: getIp(req),
          userAgent: req.headers["user-agent"]?.slice(0, 120),
          detail: buildDetail(action, resource, req, data),
        });
      } catch (_) { /* never block response */ }
    }
    return originalJson(body);
  };

  next();
}

function buildDetail(
  action: ActivityAction,
  resource: ActivityResource,
  req: Request,
  data: any,
): string {
  const title = data?.title ?? data?.name ?? data?.symbol ?? data?.slug ?? req.params?.id ?? "";
  switch (action) {
    case "create":      return `Created ${resource}: "${title}"`;
    case "update":      return `Updated ${resource}: "${title}"`;
    case "delete":      return `Deleted ${resource} id=${req.params?.id ?? "?"}`;
    case "reset":       return `Reset all ${resource} to seed data`;
    case "bulk_create": return `Bulk created ${Array.isArray(data) ? data.length : "?"} ${resource}s`;
    default:            return "";
  }
}
