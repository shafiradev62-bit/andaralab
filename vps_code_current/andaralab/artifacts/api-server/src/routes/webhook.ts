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
    const appDir = process.env["APP_DIR"] || "/opt/andara-lab";
    // Step 1: git pull only (safe inside container via bind-mounted app dir)
    const { stdout } = await execAsync(
      `cd ${appDir} && git config --global --add safe.directory ${appDir} 2>/dev/null || true && git fetch origin main && git reset --hard origin/main`,
      { timeout: 60_000 }
    );
    // Step 2: signal host to rebuild via a trigger file
    // The host-side systemd service (andaralab-deploy.service) watches for this file
    await execAsync(`touch ${appDir}/.deploy-trigger`, { timeout: 5_000 }).catch(() => {});
    res.json({ success: true, output: stdout, message: "Code updated. Host rebuild triggered." });
  } catch (e: unknown) {
    const execError = e as { message?: string; stderr?: string };
    res.status(500).json({ error: "Deploy failed", detail: execError.stderr || execError.message });
  }
});

export default router;