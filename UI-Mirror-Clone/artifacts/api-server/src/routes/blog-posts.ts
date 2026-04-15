// Blog Posts API Routes
// Resource: /api/blog — CRUD for CMS-managed blog posts with EN/ID support.

import { Router, type Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { blogPostStore } from "../lib/store.js";

// ─── Zod validation ─────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  slug:        z.string().min(1),
  locale:      z.enum(["en", "id"]),
  status:      z.enum(["draft", "published"]),
  title:       z.string().min(1),
  excerpt:     z.string().optional(),
  body:        z.array(z.string()).optional().default([]),
  category:    z.string().min(1),
  tag:         z.string().optional(),
  image:       z.string().optional(),
  readTime:    z.string().optional(),
  linkedId:    z.string().optional(),
  publishedAt: z.string().optional(),
});

const updatePostSchema = createPostSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Request body cannot be empty" }
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

function problem(res: Response, status: number, title: string, detail?: string) {
  res.status(status).json({ type: `https://andarlab.io/errors/${status}`, title, status, detail });
}

function paramStr(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

function paramInt(req: Request, name: string): number | null {
  const v = paramStr(req, name);
  return v ? parseInt(v, 10) : null;
}

function queryStr(req: Request, name: string): string | undefined {
  const v = req.query[name];
  return typeof v === "string" ? v : undefined;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const locale   = queryStr(req, "locale");
  const status   = queryStr(req, "status");
  const category = queryStr(req, "category");
  const data = blogPostStore.list({ locale, status, category });
  res.json({ data, meta: { total: data.length, locale: locale ?? "all", status: status ?? "all", category: category ?? "all" } });
});

router.post("/", (req: Request, res: Response) => {
  const result = createPostSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const post = blogPostStore.create(result.data);
  res.status(201).json({ data: post, meta: { created: true } });
});

router.post("/reset", (_req: Request, res: Response) => {
  blogPostStore.reset();
  res.json({ data: blogPostStore.list(), meta: { total: blogPostStore.list().length, reset: true } });
});

router.post("/link", (req: Request, res: Response) => {
  const { idA, idB } = req.body as { idA: number; idB: number };
  if (!idA || !idB) return problem(res, 400, "Bad Request", "idA and idB are required");
  if (!blogPostStore.get(idA) || !blogPostStore.get(idB)) return problem(res, 404, "Not Found", "One or both post IDs not found");
  blogPostStore.linkPosts(idA, idB);
  res.json({ data: { idA, idB, linked: true }, meta: { linked: true } });
});

router.get("/slug/:slug", (req: Request, res: Response) => {
  const locale = queryStr(req, "locale");
  const slug = paramStr(req, "slug");
  const post = blogPostStore.getBySlugPublic(slug, locale);
  if (post) {
    return res.json({ data: { ...post, linkedIdRecord: blogPostStore.getLinked(post.id) ?? null } });
  }
  const any = blogPostStore.getBySlug(slug, locale);
  if (any?.status === "draft") {
    return problem(
      res,
      404,
      "Not Found",
      "This post is still a draft. In Admin → Blog, publish it before it appears on the site."
    );
  }
  return problem(res, 404, "Not Found", `Post with slug '${req.params.slug}' does not exist`);
});

router.get("/:id", (req: Request, res: Response) => {
  const id = paramInt(req, "id");
  if (id === null) return problem(res, 400, "Bad Request", "Post ID must be a number");
  const post = blogPostStore.get(id);
  if (!post) return problem(res, 404, "Not Found", `Post with ID '${id}' does not exist`);
  res.json({ data: { ...post, linkedIdRecord: blogPostStore.getLinked(id) ?? null } });
});

router.put("/:id", (req: Request, res: Response) => {
  const id = paramInt(req, "id");
  if (id === null) return problem(res, 400, "Bad Request", "Post ID must be a number");
  const result = updatePostSchema.safeParse(req.body);
  if (!result.success) return problem(res, 400, "Validation Error", result.error.message);
  const updated = blogPostStore.update(id, result.data);
  if (!updated) return problem(res, 404, "Not Found", `Post with ID '${id}' does not exist`);
  res.json({ data: updated, meta: { updated: true } });
});

router.delete("/:id", (req: Request, res: Response) => {
  const id = paramInt(req, "id");
  if (id === null) return problem(res, 400, "Bad Request", "Post ID must be a number");
  if (!blogPostStore.delete(id)) return problem(res, 404, "Not Found", `Post with ID '${id}' does not exist`);
  res.status(204).end();
});

export default router;
