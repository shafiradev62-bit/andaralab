#!/usr/bin/env node
// Full deploy sesuai andaralab-rules.md
// 1. Backup data
// 2. Deploy backend fix (app.ts) via docker cp + docker exec build + docker restart backend
// 3. SCP frontend source files
// 4. rm -rf dist && pnpm run build di VPS
// 5. docker cp dist ke container + nginx reload (BUKAN restart frontend container)
// 6. Verifikasi: data count, bundle hash, Commodity di bundle

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const VPS = "177.7.55.182";
const VPS_USER = "root";
const VPS_PASS = "072398?Aarahmi";
const REMOTE_ROOT = "/opt/andara-lab";
const DATA_DIR = "/opt/andaralab-data";
const FRONTEND_CONTAINER = "andaralab-frontend-1";

// SSH via password using SSH_ASKPASS
const ASKPASS = path.join(os.tmpdir(), "andaralab-askpass.cmd");
fs.writeFileSync(ASKPASS, `@echo ${VPS_PASS}\r\n`);

const SSH_ENV = { ...process.env, SSH_ASKPASS: ASKPASS, SSH_ASKPASS_REQUIRE: "force", DISPLAY: "dummy" };
const SSH_OPTS = [
  "-o", "StrictHostKeyChecking=no",
  "-o", "PasswordAuthentication=yes",
  "-o", "PubkeyAuthentication=no",
  "-o", "BatchMode=no",
  "-o", "ConnectTimeout=20",
];

function ssh(cmd, timeout = 300000) {
  const label = cmd.length > 90 ? cmd.slice(0, 90) + "..." : cmd;
  console.log(`  [ssh] ${label}`);
  const r = spawnSync("ssh", [...SSH_OPTS, `${VPS_USER}@${VPS}`, cmd], { encoding: "utf8", timeout, env: SSH_ENV });
  if (r.error) throw new Error(`SSH spawn: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`SSH failed (${r.status}):\n${r.stderr || r.stdout}`);
  return r.stdout.trim();
}

function scp(local, remote) {
  const remoteDir = remote.replace(/\/[^/]+$/, "");
  ssh(`mkdir -p '${remoteDir}'`);
  console.log(`  [scp] ${path.basename(local)} -> ${remote}`);
  const r = spawnSync("scp", [...SSH_OPTS, local, `${VPS_USER}@${VPS}:${remote}`], { encoding: "utf8", timeout: 60000, env: SSH_ENV });
  if (r.error || r.status !== 0) throw new Error(`SCP failed: ${r.stderr || r.error}`);
}

function dataCounts() {
  const out = ssh(`python3 -c "import json,os; b='${DATA_DIR}'; [print(n+'='+str(len(json.load(open(os.path.join(b,n+'.json')))))) for n in ['datasets','posts','pages']]"`);
  return Object.fromEntries(out.split("\n").filter(Boolean).map(l => l.split("=")));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  AndaraLab Deploy — sesuai andaralab-rules   ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // Test SSH
  console.log("▶ Testing SSH...");
  const ok = ssh("echo OK");
  if (!ok.includes("OK")) throw new Error("SSH test failed");
  console.log("  ✅ Connected\n");

  // Step 1: Backup data
  console.log("▶ Step 1: Backup data (WAJIB sebelum deploy)");
  const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  ssh(`cp -r ${DATA_DIR} ${DATA_DIR}-backup-${ts}`);
  console.log(`  ✅ Backup: ${DATA_DIR}-backup-${ts}`);
  const before = dataCounts();
  console.log(`  BEFORE: datasets=${before.datasets} posts=${before.posts} pages=${before.pages}\n`);

  // Step 2: Deploy backend fix (app.ts) 
  // Fix: exclude /webhook/deploy dari requireAdminAuth
  console.log("▶ Step 2: Deploy backend fix (app.ts)");
  const repoRoot = path.resolve(__dirname, "..");
  const localAppTs = path.join(repoRoot, "artifacts/api-server/src/app.ts");
  scp(localAppTs, `${REMOTE_ROOT}/artifacts/api-server/src/app.ts`);
  // Copy ke dalam container backend (backend jalan via Docker dengan image lama)
  ssh(`docker cp ${REMOTE_ROOT}/artifacts/api-server/src/app.ts backend:/app/artifacts/api-server/src/app.ts`);
  // Rebuild di dalam container
  const buildOut = ssh(`docker exec backend sh -c "cd /app/artifacts/api-server && node build.mjs 2>&1 | tail -3"`, 120000);
  console.log("  Build:", buildOut);
  // Restart backend — terpaksa karena JS bundle perlu reload
  // Rules: JANGAN restart backend kecuali terpaksa — ini terpaksa karena fix kritis
  console.log("  Restarting backend container (terpaksa — fix kritis)...");
  ssh(`docker restart backend`, 60000);
  console.log("  Waiting 10s...");
  await sleep(10000);
  const health = ssh("curl -s http://localhost:3001/api/healthz");
  console.log("  Health:", health);
  if (!health.includes("ok")) throw new Error("Backend unhealthy!");
  console.log("  ✅ Backend OK\n");

  // Step 3: SCP frontend source files
  console.log("▶ Step 3: SCP frontend source files");
  const feBase = path.join(repoRoot, "artifacts/andaralab");
  const files = [
    "src/components/Navbar.tsx",
    "src/lib/nav-order.ts",
    "src/lib/locale.tsx",
    "src/App.tsx",
    "src/components/BlogDocEditor.tsx",
    "src/lib/blog-doc-editor.ts",
    "src/lib/cms-store.ts",
    "src/lib/post-matching.ts",
    "src/pages/AdminPage.tsx",
    "src/pages/ArticlePage.tsx",
    "src/pages/SectionPage.tsx",
    "src/pages/DataHubPage.tsx",
  ];
  for (const rel of files) {
    const local = path.join(feBase, rel);
    if (fs.existsSync(local)) scp(local, `${REMOTE_ROOT}/artifacts/andaralab/${rel}`);
    else console.log(`  [skip] ${rel}`);
  }
  console.log("  ✅ Files copied\n");

  // Step 4: Clean build di VPS
  console.log("▶ Step 4: rm -rf dist && pnpm run build (di VPS)");
  ssh(`cd ${REMOTE_ROOT}/artifacts/andaralab && rm -rf dist && pnpm run build`, 600000);
  console.log("  ✅ Build done\n");

  // Step 5: docker cp + nginx reload (JANGAN restart container)
  console.log("▶ Step 5: docker cp + nginx reload");
  ssh(`docker cp ${REMOTE_ROOT}/artifacts/andaralab/dist/public/. ${FRONTEND_CONTAINER}:/usr/share/nginx/html/`);
  ssh(`docker exec ${FRONTEND_CONTAINER} chmod 755 /usr/share/nginx/html/assets`);
  ssh(`docker exec ${FRONTEND_CONTAINER} nginx -s reload`);
  console.log("  ✅ nginx reloaded\n");

  // Step 6: Verifikasi
  console.log("▶ Step 6: Verifikasi");
  const bundleHash = ssh(`docker exec ${FRONTEND_CONTAINER} grep -o 'index\\.[0-9]*\\.js' /usr/share/nginx/html/index.html`);
  console.log("  Bundle hash:", bundleHash);

  const commodity = ssh(`docker exec ${FRONTEND_CONTAINER} sh -c 'grep -c sectoral/commodity /usr/share/nginx/html/assets/index.*.js | grep -v ":0" || echo MISSING'`);
  console.log("  Commodity:", commodity.trim() === "MISSING" || commodity.trim() === "" ? "❌ MISSING" : "✅ OK");

  const after = dataCounts();
  console.log(`  AFTER: datasets=${after.datasets} posts=${after.posts} pages=${after.pages}`);

  // Safety: data tidak boleh turun
  for (const k of ["datasets", "posts", "pages"]) {
    if (parseInt(after[k]) < parseInt(before[k])) {
      throw new Error(`DATA LOSS: ${k} turun dari ${before[k]} ke ${after[k]}! Restore: ${DATA_DIR}-backup-${ts}`);
    }
  }

  console.log("\n✅ Deploy selesai! https://andaralab.id");
  console.log("   Client: Ctrl+Shift+R untuk clear cache browser.");
  fs.unlinkSync(ASKPASS);
})().catch(e => {
  console.error("\n❌ Deploy gagal:", e.message);
  try { fs.unlinkSync(ASKPASS); } catch (_) {}
  process.exit(1);
});
