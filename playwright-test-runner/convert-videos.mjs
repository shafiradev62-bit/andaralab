#!/usr/bin/env node
/**
 * convert-videos.mjs
 * Converts all .webm recordings from Playwright test-results into .mp4
 * Uses ffmpeg (must be on PATH) or falls back to renaming with note.
 */

import { execSync, spawnSync } from "child_process";
import { readdirSync, existsSync, renameSync, mkdirSync, statSync } from "fs";
import { join, extname, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEST_RESULTS_DIR = join(ROOT, "test-results");
const MP4_OUTPUT_DIR = join(ROOT, "test-recordings-mp4");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findFiles(dir, ext) {
  const results = [];
  if (!existsSync(dir)) return results;

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === ext) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function ffmpegAvailable() {
  try {
    const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
    return r.status === 0;
  } catch {
    return false;
  }
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, "_").replace(/__+/g, "_");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("\n🎬  Andara Lab — Playwright Video Converter");
console.log("==========================================\n");

if (!existsSync(TEST_RESULTS_DIR)) {
  console.error("❌  test-results/ directory not found. Run tests first.");
  process.exit(1);
}

const webmFiles = findFiles(TEST_RESULTS_DIR, ".webm");

if (webmFiles.length === 0) {
  console.log("ℹ️  No .webm video files found in test-results/.");
  console.log("   Make sure video recording is enabled in playwright.config.ts");
  process.exit(0);
}

console.log(`📂  Found ${webmFiles.length} recording(s):\n`);
webmFiles.forEach((f, i) => {
  const size = (statSync(f).size / (1024 * 1024)).toFixed(2);
  console.log(`   ${i + 1}. ${basename(f)} (${size} MB)`);
});

mkdirSync(MP4_OUTPUT_DIR, { recursive: true });

const hasFfmpeg = ffmpegAvailable();
if (!hasFfmpeg) {
  console.log("\n⚠️  ffmpeg not found on PATH.");
  console.log("   Videos will be COPIED to test-recordings-mp4/ with .mp4 extension.");
  console.log("   → Install ffmpeg from https://ffmpeg.org/download.html to enable true conversion.\n");
}

let successCount = 0;
let failCount = 0;

for (let i = 0; i < webmFiles.length; i++) {
  const src = webmFiles[i];
  const relPath = src.replace(TEST_RESULTS_DIR, "").replace(/^[\\/]/, "");
  const testFolder = relPath.split(/[/\\]/)[0] || `recording_${i + 1}`;
  const outputName = sanitizeName(testFolder) + ".mp4";
  const dest = join(MP4_OUTPUT_DIR, outputName);

  process.stdout.write(`\n[${i + 1}/${webmFiles.length}] Converting: ${basename(src)}\n  → ${outputName}\n`);

  if (hasFfmpeg) {
    try {
      execSync(
        `ffmpeg -y -i "${src}" -vcodec libx264 -crf 23 -preset fast -movflags +faststart "${dest}"`,
        { stdio: "pipe" }
      );
      const sizeMB = (statSync(dest).size / (1024 * 1024)).toFixed(2);
      console.log(`  ✅ Done: ${outputName} (${sizeMB} MB)`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ffmpeg failed: ${err.message}`);
      // Fallback: copy as binary
      try {
        const { copyFileSync } = await import("fs");
        copyFileSync(src, dest.replace(".mp4", "_raw.webm"));
        console.log(`  ⚠️  Copied raw .webm as fallback`);
      } catch {}
      failCount++;
    }
  } else {
    // Copy file but give it .mp4 extension
    // Most modern players (VLC, browser) can play WebM even named .mp4
    try {
      const { copyFileSync } = await import("fs");
      copyFileSync(src, dest);
      const sizeMB = (statSync(dest).size / (1024 * 1024)).toFixed(2);
      console.log(`  ✅ Copied: ${outputName} (${sizeMB} MB)`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Copy failed: ${err.message}`);
      failCount++;
    }
  }
}

console.log("\n==========================================");
console.log(`🏁  Conversion Complete!`);
console.log(`   ✅ Success : ${successCount}`);
console.log(`   ❌ Failed  : ${failCount}`);
console.log(`   📁 Output  : ${MP4_OUTPUT_DIR}`);
console.log("==========================================\n");
