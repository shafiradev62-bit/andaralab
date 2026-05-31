#!/usr/bin/env node
/**
 * CMS publish smoke tests: isolated DATA_DIR + short-lived API process.
 * - Draft-only page → GET /api/pages/lookup returns 404 with draft hint
 * - Published page → 200 and correct title (newest published wins)
 * - Locale preference for /macro
 * - Blog draft vs published on GET /api/blog/slug/:slug
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function stopProc(proc) {
  if (!proc?.pid) return;
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(proc.pid), "/F", "/T"], { stdio: "ignore" });
    } else {
      proc.kill("SIGTERM");
    }
  } catch {
    /* ignore */
  }
  await sleep(500);
}

async function waitForHealth(base, timeoutMs = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(`${base}/api/healthz`);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await sleep(150);
  }
  throw new Error(`API health timeout (${base}/api/healthz)`);
}

function runServer(dataDir, port) {
  const entry = path.join(root, "artifacts", "api-server", "dist", "index.mjs");
  if (!fs.existsSync(entry)) {
    throw new Error(`Build API first (missing ${entry}). Run: pnpm --filter @workspace/api-server run build`);
  }
  return spawn(process.execPath, [entry], {
    cwd: root,
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(port), NODE_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeJson(dir, name, obj) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), JSON.stringify(obj, null, 2), "utf8");
}

const basePage = (id, overrides) => ({
  id,
  slug: "/macro",
  locale: "en",
  status: "published",
  title: `Test ${id}`,
  content: [{ type: "text", content: "verify" }],
  section: "macro",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const basePost = (id, overrides) => ({
  id,
  slug: "verify-cms-post",
  locale: "en",
  status: "published",
  title: "Blog verify",
  body: ["line"],
  category: "lab-notes",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

async function withServer(dataDir, port, fn) {
  const proc = runServer(dataDir, port);
  const base = `http://127.0.0.1:${port}`;
  let stderr = "";
  proc.stderr?.on("data", (c) => {
    stderr += c.toString();
  });
  try {
    await waitForHealth(base);
    await fn(base);
  } catch (e) {
    if (stderr) console.error("[api stderr]", stderr.slice(-2000));
    throw e;
  } finally {
    await stopProc(proc);
  }
}

async function main() {
  const port = 18000 + Math.floor(Math.random() * 2000);

  const runCase = async (label, setupDir, testFn) => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), `cms-${label}-`));
    setupDir(dataDir);
    await withServer(dataDir, port, testFn);
  };

  await runCase(
    "draft404",
    (d) => {
      writeJson(d, "pages.json", [
        basePage(1, { status: "draft", title: "Draft Only", updatedAt: "2025-01-02T00:00:00.000Z" }),
      ]);
    },
    async (base) => {
      const r = await fetch(`${base}/api/pages/lookup?path=${encodeURIComponent("/macro")}&locale=en`);
      if (r.status !== 404) throw new Error(`draft404: expected 404, got ${r.status}`);
      const j = await r.json();
      const detail = String(j.detail || "");
      if (!detail.toLowerCase().includes("draft")) {
        throw new Error(`draft404: expected draft in detail, got ${JSON.stringify(j)}`);
      }
    },
  );

  await runCase(
    "publishedNewest",
    (d) => {
      writeJson(d, "pages.json", [
        basePage(1, { status: "draft", title: "Old Draft", updatedAt: "2025-12-01T00:00:00.000Z" }),
        basePage(2, { status: "published", title: "Published Newer", updatedAt: "2026-02-02T00:00:00.000Z" }),
        basePage(3, { status: "published", title: "Published Older", updatedAt: "2025-06-01T00:00:00.000Z" }),
      ]);
    },
    async (base) => {
      const r = await fetch(`${base}/api/pages/lookup?path=${encodeURIComponent("/macro")}&locale=en`);
      if (!r.ok) throw new Error(`publishedNewest: ${r.status} ${await r.text()}`);
      const j = await r.json();
      if (j.data?.title !== "Published Newer") throw new Error(`publishedNewest: ${JSON.stringify(j.data)}`);
    },
  );

  await runCase(
    "pathNoLeadingSlash",
    (d) => {
      writeJson(d, "pages.json", [basePage(1, { status: "published", title: "NoSlashTitle", slug: "/macro" })]);
    },
    async (base) => {
      const r = await fetch(`${base}/api/pages/lookup?path=macro&locale=en`);
      if (!r.ok) throw new Error(`pathNoLeadingSlash: ${r.status}`);
      const j = await r.json();
      if (j.data?.title !== "NoSlashTitle") throw new Error(`pathNoLeadingSlash: ${JSON.stringify(j.data)}`);
    },
  );

  await runCase(
    "localePref",
    (d) => {
      writeJson(d, "pages.json", [
        basePage(1, {
          locale: "en",
          status: "published",
          title: "EN Macro",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
        basePage(2, {
          id: 2,
          locale: "id",
          status: "published",
          title: "ID Macro",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      ]);
    },
    async (base) => {
      const r = await fetch(`${base}/api/pages/lookup?path=${encodeURIComponent("/macro")}&locale=id`);
      if (!r.ok) throw new Error(`localePref: ${r.status}`);
      const j = await r.json();
      if (j.data?.title !== "ID Macro" || j.data?.locale !== "id") {
        throw new Error(`localePref: ${JSON.stringify(j.data)}`);
      }
    },
  );

  await runCase(
    "blogDraft",
    (d) => {
      writeJson(d, "posts.json", [
        basePost(1, { status: "draft", slug: "only-draft-post", title: "Draft Post" }),
      ]);
    },
    async (base) => {
      const r = await fetch(`${base}/api/blog/slug/only-draft-post?locale=en`);
      if (r.status !== 404) throw new Error(`blogDraft: expected 404, got ${r.status}`);
      const j = await r.json();
      if (!String(j.detail || "").toLowerCase().includes("draft")) {
        throw new Error(`blogDraft: ${JSON.stringify(j)}`);
      }
    },
  );

  await runCase(
    "blogPublished",
    (d) => {
      writeJson(d, "posts.json", [
        basePost(1, { status: "published", slug: "live-post", title: "Live Post Title" }),
      ]);
    },
    async (base) => {
      const r = await fetch(`${base}/api/blog/slug/live-post?locale=en`);
      if (!r.ok) throw new Error(`blogPublished: ${r.status} ${await r.text()}`);
      const j = await r.json();
      if (j.data?.title !== "Live Post Title") throw new Error(`blogPublished: ${JSON.stringify(j.data)}`);
    },
  );

  console.log("verify-cms-publish: OK (pages lookup + locale + blog slug)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
