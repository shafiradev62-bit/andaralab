#!/usr/bin/env node
// Setup SSH key + deploy backend fix + trigger frontend deploy
// sesuai andaralab-rules.md

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");

const SSH_DIR = path.join(os.homedir(), ".ssh");
const KEY_PATH = path.join(SSH_DIR, "id_ed25519_andaralab_new");
const VPS = "177.7.55.182";
const VPS_USER = "root";
const REMOTE_ROOT = "/opt/andara-lab";
const FRONTEND_CONTAINER = "andaralab-frontend-1";

const SSH_OPTS = ["-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", KEY_PATH];

function ssh(cmd) {
  console.log(`[ssh] ${cmd.slice(0, 80)}...`);
  const r = spawnSync("ssh", [...SSH_OPTS, `${VPS_USER}@${VPS}`, cmd], { encoding: "utf8", timeout: 120000 });
  if (r.error) throw new Error(`SSH spawn error: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`SSH failed (${r.status}): ${r.stderr}`);
  return r.stdout.trim();
}

function scp(localFile, remoteFile) {
  console.log(`[scp] ${localFile} -> ${remoteFile}`);
  const remoteDir = remoteFile.replace(/\/[^/]+$/, "");
  ssh(`mkdir -p ${remoteDir}`);
  const r = spawnSync("scp", [...SSH_OPTS.filter(o => o !== "BatchMode=yes"), "-o", "BatchMode=yes", localFile, `${VPS_USER}@${VPS}:${remoteFile}`], { encoding: "utf8", timeout: 60000 });
  if (r.error || r.status !== 0) throw new Error(`SCP failed: ${r.stderr || r.error}`);
}

// ── Step 1: Setup SSH key ──────────────────────────────────────────────────────
console.log("\n=== Step 1: Setup SSH key ===");
if (!fs.existsSync(SSH_DIR)) fs.mkdirSync(SSH_DIR, { mode: 0o700 });

if (!fs.existsSync(KEY_PATH)) {
  console.log("Generating SSH key...");
  // Pipe empty lines for passphrase prompts
  const r = spawnSync("ssh-keygen", ["-t", "ed25519", "-f", KEY_PATH, "-C", "kiro-deploy", "-q", "-N", ""], {
    input: "\n\n",
    encoding: "utf8",
    timeout: 15000,
  });
  if (r.status !== 0 && !fs.existsSync(KEY_PATH)) {
    console.error("ssh-keygen failed:", r.stderr);
    process.exit(1);
  }
  console.log("SSH key generated:", KEY_PATH);
} else {
  console.log("SSH key already exists:", KEY_PATH);
}

const pubKey = fs.readFileSync(KEY_PATH + ".pub", "utf8").trim();
console.log("Public key:", pubKey.slice(0, 60) + "...");

// ── Step 2: Copy public key to VPS ────────────────────────────────────────────
// Try SSH with key first; if fails, print manual instruction
console.log("\n=== Step 2: Test SSH connection ===");
let sshWorks = false;
try {
  const testR = spawnSync("ssh", [...SSH_OPTS, `${VPS_USER}@${VPS}`, "echo OK"], { encoding: "utf8", timeout: 20000 });
  if (testR.status === 0 && testR.stdout.includes("OK")) {
    sshWorks = true;
    console.log("SSH connection OK (key already authorized)");
  }
} catch (_) {}

if (!sshWorks) {
  console.log("\n⚠️  SSH key not yet authorized on VPS.");
  console.log("Run this command ONCE on the VPS Web Console (Hostinger):");
  console.log(`\n  echo '${pubKey}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys\n`);
  console.log("Then re-run this script.");
  process.exit(2);
}

// ── Step 3: Backup data ────────────────────────────────────────────────────────
console.log("\n=== Step 3: Backup data ===");
const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19).replace("T", "-");
const backupPath = `/opt/andaralab-data-backup-${ts}`;
ssh(`cp -r /opt/andaralab-data ${backupPath}`);
console.log("Backup created:", backupPath);

// Count data before
const before = ssh(`python3 -c "import json,os; b='/opt/andaralab-data'; [print(n+'='+str(len(json.load(open(os.path.join(b,n+'.json')))))) for n in ['datasets','posts','pages']]"`);
console.log("BEFORE:", before.replace(/\n/g, " "));

// ── Step 4: Deploy backend fix (app.ts) ───────────────────────────────────────
console.log("\n=== Step 4: Deploy backend fix (app.ts) ===");
const localAppTs = path.resolve(__dirname, "../artifacts/api-server/src/app.ts");
scp(localAppTs, `${REMOTE_ROOT}/artifacts/api-server/src/app.ts`);

// PM2 restart api-server (tidak docker restart - sesuai rules)
console.log("Restarting api-server via PM2...");
ssh(`cd ${REMOTE_ROOT}/artifacts/api-server && pm2 restart api-server 2>/dev/null || (PORT=3001 NODE_ENV=production DATA_DIR=/opt/andaralab-data CORS_ALLOW_ALL=true pm2 start --interpreter ./node_modules/.bin/tsx src/index.ts --name api-server)`);

// Wait for backend to be ready
console.log("Waiting 8s for backend...");
execSync("node -e \"setTimeout(()=>{},8000)\"", { timeout: 10000 });

const health = ssh("curl -s http://localhost:3001/api/healthz");
console.log("Backend health:", health);
if (!health.includes('"ok"') && !health.includes("ok")) {
  console.error("Backend health check failed!");
  process.exit(1);
}

// ── Step 5: Frontend deploy ────────────────────────────────────────────────────
console.log("\n=== Step 5: Frontend deploy ===");

// SCP changed frontend source files
const repoFrontend = path.resolve(__dirname, "../artifacts/andaralab");
const frontendFiles = [
  "src/components/Navbar.tsx",
  "src/lib/nav-order.ts",
  "src/App.tsx",
  "src/components/BlogDocEditor.tsx",
  "src/lib/blog-doc-editor.ts",
  "src/pages/AdminPage.tsx",
  "src/pages/ArticlePage.tsx",
  "src/pages/SectionPage.tsx",
  "src/pages/DataHubPage.tsx",
  "src/lib/cms-store.ts",
  "src/lib/post-matching.ts",
];

for (const rel of frontendFiles) {
  const localPath = path.join(repoFrontend, rel);
  if (fs.existsSync(localPath)) {
    scp(localPath, `${REMOTE_ROOT}/artifacts/andaralab/${rel}`);
  } else {
    console.log(`[skip] ${rel} not found locally`);
  }
}

// Clean build
console.log("Clean build on VPS...");
ssh(`cd ${REMOTE_ROOT}/artifacts/andaralab && rm -rf dist && pnpm run build`);

// Docker cp + nginx reload (JANGAN restart container)
console.log("docker cp + nginx reload...");
ssh(`docker cp ${REMOTE_ROOT}/artifacts/andaralab/dist/public/. ${FRONTEND_CONTAINER}:/usr/share/nginx/html/`);
ssh(`docker exec ${FRONTEND_CONTAINER} chmod 755 /usr/share/nginx/html/assets`);
ssh(`docker exec ${FRONTEND_CONTAINER} nginx -s reload`);

// ── Step 6: Verify ────────────────────────────────────────────────────────────
console.log("\n=== Step 6: Verify ===");

// 1. index.html bundle hash
const bundleHash = ssh(`docker exec ${FRONTEND_CONTAINER} grep -o 'index\\.[0-9]*\\.js' /usr/share/nginx/html/index.html`);
console.log("index.html bundle:", bundleHash);

// 2. Commodity in bundle
const commodityCheck = ssh(`docker exec ${FRONTEND_CONTAINER} sh -c 'grep -c sectoral/commodity /usr/share/nginx/html/assets/index.*.js | grep -v ":0" || echo MISSING'`);
console.log("Commodity in bundle:", commodityCheck.includes("MISSING") ? "❌ MISSING" : "✅ OK");

// 3. Data count after
const after = ssh(`python3 -c "import json,os; b='/opt/andaralab-data'; [print(n+'='+str(len(json.load(open(os.path.join(b,n+'.json')))))) for n in ['datasets','posts','pages']]"`);
console.log("AFTER:", after.replace(/\n/g, " "));

// Verify counts didn't drop
const beforeMap = Object.fromEntries(before.split("\n").map(l => l.split("=")));
const afterMap = Object.fromEntries(after.split("\n").map(l => l.split("=")));
for (const key of ["datasets", "posts", "pages"]) {
  const b = parseInt(beforeMap[key] || "0");
  const a = parseInt(afterMap[key] || "0");
  if (a < b) {
    console.error(`❌ DATA LOSS: ${key} dropped from ${b} to ${a}! Restore: ${backupPath}`);
    process.exit(1);
  }
}

console.log("\n✅ Deploy selesai! Buka https://andaralab.id");
console.log("   Client perlu Ctrl+Shift+R untuk clear cache.");
