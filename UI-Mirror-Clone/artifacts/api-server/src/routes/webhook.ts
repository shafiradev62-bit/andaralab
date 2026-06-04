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

    // Aman: ff-only pull (bukan reset --hard). Backup + build di host script.
    const { stdout } = await execAsync(
      `cd ${appDir} && git config --global --add safe.directory ${appDir} 2>/dev/null || true && git fetch origin main && git checkout main && git pull --ff-only origin main`,
      { timeout: 120_000 },
    );

    await execAsync(`touch ${appDir}/.deploy-trigger`, { timeout: 5_000 }).catch(() => {});
    await execAsync(`bash ${appDir}/scripts/vps-deploy-on-server.sh`, { timeout: 900_000 }).catch(() => {});

    res.json({
      success: true,
      output: stdout,
      message: "Safe deploy triggered (backup + ff-only pull + vps-deploy-on-server.sh).",
    });
  } catch (e: unknown) {
    const execError = e as { message?: string; stderr?: string };
    res.status(500).json({ error: "Deploy failed", detail: execError.stderr || execError.message });
  }
});

export default router;