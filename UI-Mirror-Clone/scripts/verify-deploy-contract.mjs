#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const REQUIRED_CONTRACT_PATTERNS = [
  ["Dockerfile.frontend", "VITE_API_BASE_URL=/api"],
  ["Dockerfile.frontend", /VITE_API_FALLBACK_BASE_URL=http:\/\/(76\.13\.17\.91|177\.7\.55\.182):3001\/api/],
  ["docker-compose.yml", "/opt/andaralab-data:/data"],
  ["docker-compose.yml", "CORS_ALLOW_ALL=true"],
  ["artifacts/andaralab/src/lib/config.ts", 'VITE_API_BASE_URL ?? "/api"'],
  [
    "artifacts/andaralab/src/lib/config.ts",
    /VITE_API_FALLBACK_BASE_URL \?\? "http:\/\/(76\.13\.17\.91|177\.7\.55\.182):3001\/api"/,
  ],
  ["AGENTS.md", "Agent Operating Contract"],
];

const issues = [];

for (const [relPath, pattern] of REQUIRED_CONTRACT_PATTERNS) {
  const absPath = path.join(root, relPath);
  if (!fs.existsSync(absPath)) {
    issues.push(`${relPath} (missing file)`);
    continue;
  }
  const content = fs.readFileSync(absPath, "utf8");
  if (pattern instanceof RegExp) {
    if (!pattern.test(content)) {
      issues.push(`${relPath} missing required pattern: ${pattern}`);
    }
  } else if (!content.includes(pattern)) {
    issues.push(`${relPath} missing required pattern: ${pattern}`);
  }
}

if (issues.length > 0) {
  console.error("verify-deploy-contract: FAILED");
  for (const item of issues) console.error(` - ${item}`);
  process.exit(1);
}

console.log("verify-deploy-contract: OK");
