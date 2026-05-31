#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, ".githooks");
function findGitDir(start) {
  let dir = start;
  while (true) {
    const candidate = path.join(dir, ".git");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const gitDir = findGitDir(root);
const targetDir = gitDir ? path.join(gitDir, "hooks") : "";

if (!gitDir) {
  console.error("install-git-hooks: .git folder not found");
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error("install-git-hooks: .githooks folder not found");
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const hookFiles = ["pre-commit", "pre-push"];
for (const hook of hookFiles) {
  const src = path.join(sourceDir, hook);
  const dst = path.join(targetDir, hook);
  if (!fs.existsSync(src)) {
    console.error(`install-git-hooks: source hook missing: ${hook}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dst);
  try {
    fs.chmodSync(dst, 0o755);
  } catch {
    // Windows may ignore POSIX chmod; hook still works with Git Bash.
  }
}

console.log("install-git-hooks: OK");
