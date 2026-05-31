/**
 * AWS S3 Sync — Continuous backup & restore for all data files.
 *
 * HOW IT WORKS:
 * - Every time a JSON file is written to disk, it's also uploaded to S3.
 * - On server startup, if a local file is missing/empty, it's restored from S3.
 * - This means data survives container rebuilds, VPS wipes, and accidental deletes.
 *
 * REQUIRED ENV VARS:
 *   AWS_REGION          e.g. ap-southeast-1
 *   AWS_S3_BUCKET       e.g. andaralab-data-backup
 *   AWS_ACCESS_KEY_ID   IAM key with s3:GetObject + s3:PutObject on the bucket
 *   AWS_SECRET_ACCESS_KEY
 *
 * OPTIONAL:
 *   AWS_S3_PREFIX       folder prefix inside bucket, default: "andaralab-data"
 *   AWS_S3_SYNC_ENABLED set to "false" to disable (default: enabled if bucket is set)
 */

import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

export interface S3SyncConfig {
  enabled: boolean;
  region: string;
  bucket: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function getS3Config(): S3SyncConfig {
  const bucket = process.env.AWS_S3_BUCKET ?? "";
  const enabled =
    process.env.AWS_S3_SYNC_ENABLED !== "false" &&
    bucket.length > 0 &&
    (process.env.AWS_ACCESS_KEY_ID ?? "").length > 0 &&
    (process.env.AWS_SECRET_ACCESS_KEY ?? "").length > 0;

  return {
    enabled,
    region: process.env.AWS_REGION ?? "ap-southeast-1",
    bucket,
    prefix: (process.env.AWS_S3_PREFIX ?? "andaralab-data").replace(/\/$/, ""),
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  };
}

// ─── S3 Client (lightweight — no SDK, pure HTTPS + AWS Signature V4) ─────────
// We avoid the full @aws-sdk/client-s3 to keep the bundle small.
// Only need PutObject and GetObject.

import { createHmac, createHash } from "crypto";
import https from "https";

function sha256hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate    = hmacSha256("AWS4" + secretKey, dateStamp);
  const kRegion  = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  return kSigning;
}

interface S3RequestOptions {
  method: "PUT" | "GET";
  bucket: string;
  key: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  body?: Buffer;
  contentType?: string;
}

function s3Request(opts: S3RequestOptions): Promise<{ statusCode: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const amzDate  = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);

    const host        = `${opts.bucket}.s3.${opts.region}.amazonaws.com`;
    const canonicalUri = "/" + opts.key.split("/").map(encodeURIComponent).join("/");
    const body        = opts.body ?? Buffer.alloc(0);
    const payloadHash = sha256hex(body);
    const contentType = opts.contentType ?? "application/json";

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      opts.method,
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${opts.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256hex(canonicalRequest),
    ].join("\n");

    const signingKey = getSigningKey(opts.secretAccessKey, dateStamp, opts.region, "s3");
    const signature  = hmacSha256(signingKey, stringToSign).toString("hex");

    const authHeader =
      `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const reqOptions: https.RequestOptions = {
      hostname: host,
      path: canonicalUri,
      method: opts.method,
      headers: {
        "Content-Type": contentType,
        "Content-Length": body.length,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authHeader,
      },
    };

    const req = https.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve({ statusCode: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
    });

    req.on("error", reject);
    req.setTimeout(10_000, () => { req.destroy(new Error("S3 request timeout")); });

    if (body.length > 0) req.write(body);
    req.end();
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _config: S3SyncConfig | null = null;

function cfg(): S3SyncConfig {
  if (!_config) _config = getS3Config();
  return _config;
}

/**
 * Upload a local JSON file to S3.
 * Called automatically after every writeJson().
 */
export async function uploadToS3(filename: string, content: string): Promise<void> {
  const c = cfg();
  if (!c.enabled) return;

  const key = `${c.prefix}/${filename}`;
  try {
    const res = await s3Request({
      method: "PUT",
      bucket: c.bucket,
      key,
      region: c.region,
      accessKeyId: c.accessKeyId,
      secretAccessKey: c.secretAccessKey,
      body: Buffer.from(content, "utf-8"),
      contentType: "application/json",
    });

    if (res.statusCode === 200) {
      console.log(`[s3] ✓ Uploaded ${filename} → s3://${c.bucket}/${key}`);
    } else {
      console.error(`[s3] ✗ Upload ${filename} failed: HTTP ${res.statusCode} — ${res.body.toString().slice(0, 200)}`);
    }
  } catch (err) {
    console.error(`[s3] ✗ Upload ${filename} error:`, err);
  }
}

/**
 * Download a file from S3 and return its content.
 * Returns null if not found or S3 is disabled.
 */
export async function downloadFromS3(filename: string): Promise<string | null> {
  const c = cfg();
  if (!c.enabled) return null;

  const key = `${c.prefix}/${filename}`;
  try {
    const res = await s3Request({
      method: "GET",
      bucket: c.bucket,
      key,
      region: c.region,
      accessKeyId: c.accessKeyId,
      secretAccessKey: c.secretAccessKey,
    });

    if (res.statusCode === 200) {
      const content = res.body.toString("utf-8");
      console.log(`[s3] ✓ Downloaded ${filename} from s3://${c.bucket}/${key} (${content.length} bytes)`);
      return content;
    } else if (res.statusCode === 404) {
      console.log(`[s3] ℹ ${filename} not found in S3 (first run?)`);
      return null;
    } else {
      console.error(`[s3] ✗ Download ${filename} failed: HTTP ${res.statusCode}`);
      return null;
    }
  } catch (err) {
    console.error(`[s3] ✗ Download ${filename} error:`, err);
    return null;
  }
}

/**
 * On startup: for each data file, if local is missing/empty, restore from S3.
 * Call this BEFORE initializing any store.
 */
export async function restoreFromS3IfNeeded(dataDir: string, filenames: string[]): Promise<void> {
  const c = cfg();
  if (!c.enabled) {
    console.log("[s3] Sync disabled — skipping restore check");
    return;
  }

  console.log(`[s3] Checking ${filenames.length} files for S3 restore...`);

  for (const filename of filenames) {
    const localPath = path.join(dataDir, filename);
    const needsRestore =
      !fs.existsSync(localPath) ||
      fs.statSync(localPath).size < 5; // empty or near-empty

    if (!needsRestore) {
      console.log(`[s3] ✓ ${filename} exists locally — no restore needed`);
      continue;
    }

    console.warn(`[s3] ⚠ ${filename} missing/empty locally — attempting S3 restore...`);
    const content = await downloadFromS3(filename);
    if (content) {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(localPath, content, "utf-8");
      console.log(`[s3] ✅ Restored ${filename} from S3 (${content.length} bytes)`);
    } else {
      console.warn(`[s3] ⚠ Could not restore ${filename} from S3 — will use seed data`);
    }
  }
}

/**
 * Upload all local data files to S3.
 * Used on startup so S3 always has a complete snapshot,
 * even if no CRUD write happens after boot.
 */
export async function syncAllFilesToS3(dataDir: string, filenames: string[]): Promise<void> {
  const c = cfg();
  if (!c.enabled) {
    return;
  }

  console.log(`[s3] Starting full sync for ${filenames.length} files...`);
  for (const filename of filenames) {
    const localPath = path.join(dataDir, filename);
    if (!fs.existsSync(localPath)) {
      console.warn(`[s3] ⚠ Skip ${filename}: local file missing`);
      continue;
    }
    try {
      const content = fs.readFileSync(localPath, "utf-8");
      if (!content.trim()) {
        console.warn(`[s3] ⚠ Skip ${filename}: local file empty`);
        continue;
      }
      // Verify JSON before upload to avoid backing up corrupted payloads.
      JSON.parse(content);
      await uploadToS3(filename, content);
    } catch (err) {
      console.error(`[s3] ✗ Full sync failed for ${filename}:`, err);
    }
  }
  console.log("[s3] Full sync completed");
}

/**
 * Log S3 sync status on startup.
 */
export function logS3Status(): void {
  const c = cfg();
  if (c.enabled) {
    console.log(`[s3] ✅ AWS S3 sync ENABLED`);
    console.log(`[s3]    Bucket : s3://${c.bucket}/${c.prefix}/`);
    console.log(`[s3]    Region : ${c.region}`);
  } else {
    const missing: string[] = [];
    if (!process.env.AWS_S3_BUCKET)          missing.push("AWS_S3_BUCKET");
    if (!process.env.AWS_ACCESS_KEY_ID)      missing.push("AWS_ACCESS_KEY_ID");
    if (!process.env.AWS_SECRET_ACCESS_KEY)  missing.push("AWS_SECRET_ACCESS_KEY");
    if (missing.length > 0) {
      console.log(`[s3] ⚠ AWS S3 sync DISABLED — missing env vars: ${missing.join(", ")}`);
    } else {
      console.log(`[s3] ⚠ AWS S3 sync DISABLED via AWS_S3_SYNC_ENABLED=false`);
    }
  }
}
