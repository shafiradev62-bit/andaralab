import { Router, type IRouter } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router: IRouter = Router();

// Simple secret-based webhook to trigger git pull + rebuild on VPS
// Usage: POST /api/webhook/deploy?secret=YOUR_SECRET
router.post("/deploy", async (req, res) => {
  const secret = req.query["secret"] as string | undefined;
  const expectedSecret = process.env["DEPLOY_WEBHOOK_SECRET"];

  if (!expectedSecret) {
    res.status(503).json({ error: "Webhook not configured on server" });
    return;
  }

  if (!secret || secret !== expectedSecret) {
    res.status(401).json({ error: "Invalid secret" });
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(
      "cd /root/andaralab && git fetch origin main && git reset --hard origin/main && docker compose build --no-cache && docker compose up -d",
      { timeout: 600_000 }
    );
    res.json({ success: true, output: stdout });
  } catch (e: unknown) {
    const execError = e as { message?: string; stderr?: string };
    res.status(500).json({ error: "Deploy failed", detail: execError.stderr || execError.message });
  }
});

export default router;