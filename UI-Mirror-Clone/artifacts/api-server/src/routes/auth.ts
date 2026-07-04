import { Router } from "express";
import type { Request, Response } from "express";
import {
  createAdminSession,
  getAdminSession,
  renewAdminSession,
  revokeAdminSession,
  validateAdminCredentials,
} from "../lib/admin-auth.js";
import { activityLogStore } from "../lib/store.js";

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function getUserAgent(req: Request): string | undefined {
  const ua = req.headers["user-agent"];
  if (typeof ua === "string") return ua.slice(0, 120);
  return undefined;
}

function getBearer(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!validateAdminCredentials(username, password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const session = createAdminSession(username);
  activityLogStore.log({
    action: "login",
    resource: "auth",
    resourceId: username,
    resourceTitle: username,
    ip: getIp(req),
    userAgent: getUserAgent(req),
    detail: `Admin login success: ${username}`,
  });

  return res.json({
    data: {
      token: session.token,
      username: session.username,
      expiresAt: session.expiresAt,
    },
  });
});

router.get("/me", (req: Request, res: Response) => {
  const token = getBearer(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const session = getAdminSession(token);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ data: { username: session.username, expiresAt: session.expiresAt } });
});

router.post("/renew", (req: Request, res: Response) => {
  const token = getBearer(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const session = renewAdminSession(token);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  return res.json({
    data: {
      username: session.username,
      expiresAt: session.expiresAt,
    },
  });
});

router.post("/logout", (req: Request, res: Response) => {
  const token = getBearer(req);
  if (token) {
    const session = getAdminSession(token);
    if (session) {
      activityLogStore.log({
        action: "logout",
        resource: "auth",
        resourceId: session.username,
        resourceTitle: session.username,
        ip: getIp(req),
        userAgent: getUserAgent(req),
        detail: `Admin logout: ${session.username}`,
      });
    }
    revokeAdminSession(token);
  }
  return res.json({ data: { success: true } });
});

export default router;
