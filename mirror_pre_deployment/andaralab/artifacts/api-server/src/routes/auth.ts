import { Router } from "express";
import { activityLogStore } from "../lib/store.js";

const router = Router();

function getIp(req: any): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

// POST /api/auth/login-log
// Dipanggil frontend setelah login berhasil untuk mencatat ke activity log.
// Tidak ada credential yang dikirim ke sini — hanya username dan event.
router.post("/login-log", (req, res) => {
  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ ok: false });

  activityLogStore.log({
    action:        "login",
    resource:      "auth",
    resourceId:    username,
    resourceTitle: username,
    ip:            getIp(req),
    userAgent:     req.headers["user-agent"]?.slice(0, 200),
    detail:        `Admin login: ${username}`,
  });

  return res.json({ ok: true });
});

export default router;
