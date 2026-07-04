import type { BlogPost } from "./cms-store";

const GENERIC_SECTION_NAMES = new Set([
  "macro foundations",
  "sectoral intelligence",
  "fondasi makro",
  "intelijen sektoral",
  "macro",
  "sectoral",
  "financial markets",
  "pasar keuangan",
]);

const GENERIC_SLUG_SEGMENTS = new Set([
  "macro",
  "sectoral",
  "blog",
  "data",
  "en",
  "id",
  "admin",
]);

/** Blog sub-menus — never show on Macro/Sectoral research sub-pages. */
const BLOG_ONLY_CATEGORIES = new Set([
  "economics-101",
  "economics 101",
  "market-pulse",
  "market pulse",
  "lab-notes",
  "lab notes",
]);

/** Slug token → expected subcategory labels for strict subsection matching. */
const SLUG_SUBMENU_HINTS: Record<string, string[]> = {
  "deep-dives": ["Strategic Industry Deep-dives", "deep-dives", "deep dives"],
  regional: ["Regional Economic Monitor", "regional", "regional monitor"],
  esg: ["ESG", "esg"],
  commodity: ["Commodity", "commodity", "Commodities", "komoditas"],
  "macro-outlooks": ["Macro Outlooks", "macro-outlooks", "prospek makro", "outlooks"],
  "policy-monetary": [
    "Policy & Monetary Watch",
    "Kebijakan & Moneter",
    "policy-monetary",
  ],
  geopolitical: [
    "Geopolitical & Structural Analysis",
    "geopolitical",
    "geopolitical & structural",
  ],
};

/** Distinctive slug token for subsection pages (e.g. policy-monetary, geopolitical). */
export function distinctiveSlugToken(slug?: string): string {
  const segments = (slug ?? "").split("/").filter(Boolean);
  const specific = segments.filter((s) => !GENERIC_SLUG_SEGMENTS.has(s.toLowerCase()));
  return (specific[specific.length - 1] ?? segments[segments.length - 1] ?? "").toLowerCase();
}

export function isResearchSubsectionPage(pageSlug?: string): boolean {
  if (!pageSlug) return false;
  // Match /macro/xxx, /sectoral/xxx, or top-level research tokens
  const isStandard = !!pageSlug.match(/^\/(macro|sectoral)\/[^/]+$/);
  const token = distinctiveSlugToken(pageSlug);
  const isKnownToken = !!SLUG_SUBMENU_HINTS[token];
  return isStandard || isKnownToken;
}

export function isBlogOnlyPost(post: BlogPost): boolean {
  const cat = (post.category || "").toLowerCase().trim();
  if (BLOG_ONLY_CATEGORIES.has(cat)) return true;
  return [...BLOG_ONLY_CATEGORIES].some((b) => cat.includes(b));
}

export function extractPageFilterKeywords(
  slug?: string,
  title?: string,
): string[] {
  const token = distinctiveSlugToken(slug);
  const raw = [token, title].filter(Boolean).join(" ");
  const words = raw
    .toLowerCase()
    .split(/[\s\-\/&,()]+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter(
      (w) =>
        w.length > 2 &&
        !GENERIC_SLUG_SEGMENTS.has(w) &&
        !["the", "and", "for", "new", "page", "root", "admin", "watch", "analysis"].includes(w),
    );
  const out = new Set<string>();
  if (token) out.add(token);
  for (const w of words) out.add(w);
  return [...out];
}

function fieldMatchesFilter(field: string, filter: string): boolean {
  if (!field || !filter) return false;
  if (field === filter) return true;
  if (field.length >= 4 && filter.length >= 4) {
    if (field.includes(filter) || filter.includes(field)) return true;
  }
  return false;
}

function subcategoryMatchesHint(postSub: string, hints: string[]): boolean {
  if (!postSub) return false;
  const norm = postSub.toLowerCase().trim();
  return hints.some((h) => {
    const hint = h.toLowerCase().trim();
    return norm === hint || norm.includes(hint) || hint.includes(norm);
  });
}

/** Strict: subsection pages only show posts whose subcategory matches the submenu. */
export function matchesSubsectionStrict(post: BlogPost, pageSlug?: string): boolean {
  const token = distinctiveSlugToken(pageSlug);
  const hints = SLUG_SUBMENU_HINTS[token];
  if (!hints) return false;

  if (token === "macro-outlooks" && post.hideFromMacroOutlook) return false;

  const postSub = (post.subcategory || "").toLowerCase().trim();
  return subcategoryMatchesHint(postSub, hints);
}

/** Strict post-to-section matching — avoids cross-submenu false positives. */
export function postMatchesCategories(
  post: BlogPost,
  categories: string[],
  pageSlug?: string,
): boolean {
  if (categories.includes("__all__")) return true;

  if (pageSlug && isResearchSubsectionPage(pageSlug)) {
    if (isBlogOnlyPost(post)) return false;
    return matchesSubsectionStrict(post, pageSlug);
  }

  const postCat = (post.category || "").toLowerCase();
  const postSub = (post.subcategory || "").toLowerCase();
  const postTag = (post.tag || "").toLowerCase();
  const postFields = [postCat, postSub, postTag].filter(Boolean);
  const slugToken = distinctiveSlugToken(pageSlug);

  for (const filterCat of categories) {
    const fc = filterCat.toLowerCase();

    if (GENERIC_SECTION_NAMES.has(fc)) {
      if (postCat !== fc) continue;
      if (slugToken && SLUG_SUBMENU_HINTS[slugToken]) continue;
      return true;
    }

    if (postCat === fc || postSub === fc || postTag === fc) return true;

    for (const field of postFields) {
      if (fieldMatchesFilter(field, fc)) return true;
    }

    const filterWords = fc.split(/[\s\-&,]+/).filter((w) => w.length > 3);
    if (filterWords.length >= 2) {
      const postWords = new Set(
        postFields.flatMap((f) => f.split(/[\s\-&,]+/).filter((w) => w.length > 3)),
      );
      if (filterWords.every((fw) => postWords.has(fw))) return true;
    }
  }

  if (slugToken.length >= 4) {
    const slugPhrase = slugToken.replace(/-/g, " ");
    for (const field of postFields) {
      if (field.includes(slugToken) || field.includes(slugPhrase)) return true;
    }
  }

  return false;
}
