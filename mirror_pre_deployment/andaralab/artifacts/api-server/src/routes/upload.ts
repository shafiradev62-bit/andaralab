// Image Upload Route — /api/upload/image
// POST /api/upload/image   — accepts { filename, dataUrl } and saves to /data/images/
// GET  /api/upload/images  — list all uploaded images

import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = Router();

const DATA_DIR = process.env.DATA_DIR ?? "/data";
const IMAGES_DIR = path.join(DATA_DIR, "images");

// Ensure images dir exists
function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

// Allowed MIME types
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  // data:[<mediatype>][;base64],<data>
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];
  try {
    const buffer = Buffer.from(base64Data, "base64");
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

// POST /api/upload/image
router.post("/image", (req: Request, res: Response) => {
  ensureImagesDir();

  const { dataUrl, filename } = req.body as { dataUrl?: string; filename?: string };

  if (!dataUrl || typeof dataUrl !== "string") {
    return res.status(400).json({ error: "Missing dataUrl field (base64 data URL)" });
  }

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return res.status(400).json({ error: "Invalid data URL format. Expected: data:<mime>;base64,<data>" });
  }

  const ext = ALLOWED_MIME[parsed.mimeType];
  if (!ext) {
    return res.status(400).json({ error: `Unsupported image type: ${parsed.mimeType}. Allowed: jpeg, png, gif, webp, svg` });
  }

  // Max 10 MB
  if (parsed.buffer.byteLength > 10 * 1024 * 1024) {
    return res.status(413).json({ error: "Image too large. Maximum 10 MB." });
  }

  // Generate a unique filename: original-name-slug + short hash + ext
  const baseName = filename
    ? path.basename(filename, path.extname(filename))
        .replace(/[^a-zA-Z0-9_\-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40)
    : "image";
  const hash = crypto.randomBytes(6).toString("hex");
  const savedFilename = `${baseName}-${hash}${ext}`;
  const savedPath = path.join(IMAGES_DIR, savedFilename);

  try {
    fs.writeFileSync(savedPath, parsed.buffer);
  } catch (err: any) {
    return res.status(500).json({ error: `Failed to save image: ${err?.message ?? err}` });
  }

  const publicUrl = `/images/${savedFilename}`;
  return res.status(201).json({
    url: publicUrl,
    filename: savedFilename,
    bytes: parsed.buffer.byteLength,
    mimeType: parsed.mimeType,
  });
});

// GET /api/upload/images — list all uploaded images
router.get("/images", (_req: Request, res: Response) => {
  ensureImagesDir();
  try {
    const files = fs.readdirSync(IMAGES_DIR).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext);
    });
    const images = files.map((f) => ({
      filename: f,
      url: `/images/${f}`,
      bytes: fs.statSync(path.join(IMAGES_DIR, f)).size,
    }));
    res.json({ images, count: images.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to list images" });
  }
});

export default router;
