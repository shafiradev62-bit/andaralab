// Middleware: auto-log all mutating API calls to activityLogStore
// Captures before/after snapshots and field-level diffs for full audit trail.
// Handles DELETE correctly (204 → 200 with body so logger can capture it).
import type { Request, Response, NextFunction } from "express";
import { activityLogStore, datasetStore, pageStore, blogPostStore, calendarEventStore, exchangeRateStore } from "../lib/store.js";
import type { ActivityAction, ActivityResource } from "../lib/store.js";

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function resolveResource(path: string): ActivityResource | null {
  if (path.includes("/datasets"))          return "dataset";
  if (path.includes("/pages"))             return "page";
  if (path.includes("/blog"))              return "post";
  if (path.includes("/analisis"))          return "analisis";
  if (path.includes("/featured-insights")) return "featured_insights";
  if (path.includes("/exchange-rates"))    return "exchange_rate";
  if (path.includes("/calendar/events"))   return "calendar_event";
  if (path.includes("/calendar/config"))   return "calendar_config";
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

function fetchBefore(resource: ActivityResource, req: Request): Record<string, unknown> | undefined {
  const id = req.params?.id;
  if (!id) return undefined;
  try {
    switch (resource) {
      case "dataset":        return datasetStore.get(id) as Record<string, unknown> | undefined;
      case "calendar_event": return calendarEventStore.get(id) as Record<string, unknown> | undefined;
      case "exchange_rate":  return exchangeRateStore.get(id) as Record<string, unknown> | undefined;
      case "page": {
        const numId = parseInt(id, 10);
        return isNaN(numId) ? undefined : pageStore.get(numId) as Record<string, unknown> | undefined;
      }
      case "post": {
        const numId = parseInt(id, 10);
        return isNaN(numId) ? undefined : blogPostStore.get(numId) as Record<string, unknown> | undefined;
      }
      default: return undefined;
    }
  } catch (_) {
    return undefined;
  }
}

function buildDiff(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
): string | undefined {
  if (!before || !after) return undefined;
  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const skip = new Set(["updatedAt", "createdAt"]);
  for (const key of allKeys) {
    if (skip.has(key)) continue;
    const bVal = JSON.stringify(before[key]);
    const aVal = JSON.stringify(after[key]);
    if (bVal !== aVal) {
      const bStr = bVal && bVal.length > 120 ? bVal.slice(0, 120) + "…" : (bVal ?? "undefined");
      const aStr = aVal && aVal.length > 120 ? aVal.slice(0, 120) + "…" : (aVal ?? "undefined");
      changes.push(`${key}: ${bStr} → ${aStr}`);
    }
  }
  return changes.length > 0 ? changes.join(" | ") : undefined;
}

function buildDetail(
  action: ActivityAction,
  resource: ActivityResource,
  req: Request,
  data: any,
  before?: Record<string, unknown>,
): string {
  const title = data?.title ?? data?.name ?? data?.symbol ?? data?.slug
    ?? before?.title ?? before?.name ?? before?.symbol ?? before?.slug
    ?? req.params?.id ?? "";
  const id = data?.id ?? req.params?.id ?? "?";

  switch (action) {
    case "create":      return `Created ${resource} id=${id}: "${title}"`;
    case "update":      return `Updated ${resource} id=${id}: "${title}"`;
    case "delete":      return `Deleted ${resource} id=${req.params?.id ?? "?"}: "${title}"`;
    case "reset":       return `Reset all ${resource} to seed data`;
    case "bulk_create": return `Bulk created ${Array.isArray(data) ? data.length : "?"} ${resource}(s)`;
    default:            return "";
  }
}

export function activityLogger(req: Request, res: Response, next: NextFunction) {
  const method   = req.method.toUpperCase();
  const resource = resolveResource(req.path);
  const action   = resolveAction(method, req.path);

  if (!resource || !action) return next();

  // Capture BEFORE state for update/delete
  const beforeSnapshot = (action === "update" || action === "delete")
    ? fetchBefore(resource, req)
    : undefined;

  // ── DELETE: intercept res.end (204 No Content has no body) ──────────────────
  if (action === "delete") {
    const originalEnd = res.end.bind(res);
    // @ts-ignore
    res.end = function (chunk?: any, ...args: any[]) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          activityLogStore.log({
            action,
            resource,
            resourceId:    req.params?.id,
            resourceTitle: beforeSnapshot
              ? String(beforeSnapshot.title ?? beforeSnapshot.name ?? beforeSnapshot.symbol ?? beforeSnapshot.slug ?? req.params?.id ?? "")
              : req.params?.id,
            ip:        getIp(req),
            userAgent: req.headers["user-agent"]?.slice(0, 200),
            detail:    buildDetail(action, resource, req, null, beforeSnapshot),
            before:    beforeSnapshot,
            after:     undefined,
            diff:      undefined,
          });
        } catch (_) { /* never block response */ }
      }
      return originalEnd(chunk, ...args);
    };
    return next();
  }

  // ── CREATE / UPDATE / RESET / BULK: intercept res.json ──────────────────────
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const data          = body?.data;
        const resourceId    = data?.id ? String(data.id) : req.params?.id ?? undefined;
        const resourceTitle = data?.title ?? data?.name ?? data?.symbol ?? data?.slug ?? undefined;

        const afterSnapshot: Record<string, unknown> | undefined =
          (action === "create" || action === "update") && data && typeof data === "object"
            ? (data as Record<string, unknown>)
            : undefined;

        const diff = buildDiff(beforeSnapshot, afterSnapshot);

        activityLogStore.log({
          action,
          resource,
          resourceId,
          resourceTitle: resourceTitle ? String(resourceTitle) : undefined,
          ip:        getIp(req),
          userAgent: req.headers["user-agent"]?.slice(0, 200),
          detail:    buildDetail(action, resource, req, data, beforeSnapshot),
          before:    beforeSnapshot,
          after:     afterSnapshot,
          diff,
        });
      } catch (_) { /* never block response */ }
    }
    return originalJson(body);
  };

  next();
}
