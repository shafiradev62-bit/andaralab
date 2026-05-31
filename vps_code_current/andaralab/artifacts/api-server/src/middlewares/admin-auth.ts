import type { NextFunction, Request, Response } from "express";
import { getAdminSession } from "../lib/admin-auth.js";

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

export interface AdminAuthRequest extends Request {
  adminUser?: string;
}

export function requireAdminAuth(req: AdminAuthRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized", detail: "Missing admin token" });
    return;
  }

  const session = getAdminSession(token);
  if (!session) {
    res.status(401).json({ error: "Unauthorized", detail: "Invalid or expired admin token" });
    return;
  }

  req.adminUser = session.username;
  next();
}
