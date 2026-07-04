const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const VPS = "177.7.55.182";
const VPS_USER = "root";
const VPS_PASS = "072398?Aarahmi";

const ASKPASS_SCRIPT = path.join(os.tmpdir(), "andaralab-askpass.cmd");
fs.writeFileSync(ASKPASS_SCRIPT, `@echo ${VPS_PASS}\r\n`);

const SSH_ENV = {
  ...process.env,
  SSH_ASKPASS: ASKPASS_SCRIPT,
  SSH_ASKPASS_REQUIRE: "force",
  DISPLAY: "dummy",
};

const SSH_OPTS = [
  "-o", "StrictHostKeyChecking=no",
  "-o", "PasswordAuthentication=yes",
  "-o", "PubkeyAuthentication=no",
  "-o", "BatchMode=no",
  "-o", "ConnectTimeout=15",
];

function ssh(cmd) {
  const r = spawnSync("ssh", [...SSH_OPTS, `${VPS_USER}@${VPS}`, cmd], {
    encoding: "utf8", timeout: 30000, env: SSH_ENV,
  });
  if (r.error || r.status !== 0) {
    console.error("FAIL:", r.stderr);
    return "";
  }
  return r.stdout.trim();
}

console.log("=== VPS Check ===");
console.log("pm2 list:", ssh("pm2 list 2>&1 | head -20"));
console.log("tsx locations:", ssh("find /opt/andara-lab -name tsx -type f 2>/dev/null | head -5"));
console.log("which tsx:", ssh("which tsx 2>/dev/null || echo NOT_IN_PATH"));
console.log("pm2 info api-server:", ssh("pm2 show api-server 2>&1 | grep -E 'interpreter|script|status' | head -10"));
