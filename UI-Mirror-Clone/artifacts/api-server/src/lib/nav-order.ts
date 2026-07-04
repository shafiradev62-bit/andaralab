export const DEFAULT_NAV_ORDER_BY_SLUG: Record<string, number> = {
  "/macro": 0,
  "/macro/macro-outlooks": 1,
  "/macro/policy-monetary": 2,
  "/macro/geopolitical": 3,
  "/sectoral/deep-dives": 1,
  "/sectoral/regional": 2,
  "/sectoral/esg": 3,
  "/sectoral/commodity": 4,
  "/data": 1,
  "/data/economic-calendar": 2,
  "/data/market-dashboard": 3,
  "/blog/economics-101": 1,
  "/blog/market-pulse": 2,
  "/blog/lab-notes": 3,
};

export function normalizeSlugForNav(slug: string): string {
  const s = (slug || "").trim();
  if (!s || s === "/") return "/";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
}

export function resolveNavOrder(slug: string, navOrder?: number | null): number {
  if (typeof navOrder === "number" && navOrder >= 0) return navOrder;
  const norm = normalizeSlugForNav(slug);
  if (DEFAULT_NAV_ORDER_BY_SLUG[norm] !== undefined) {
    return DEFAULT_NAV_ORDER_BY_SLUG[norm];
  }
  return 999;
}

export function normalizePageNavOrder<T extends { slug: string; navOrder?: number | null }>(
  page: T,
): T {
  return { ...page, navOrder: resolveNavOrder(page.slug, page.navOrder) };
}

export function normalizePostImagePosition<
  T extends { imagePosition?: "top" | "bottom" | "left" | "right" | null },
>(post: T): T {
  const pos = post.imagePosition;
  if (pos === "top" || pos === "bottom" || pos === "left" || pos === "right") {
    return post;
  }
  return { ...post, imagePosition: "top" };
}
