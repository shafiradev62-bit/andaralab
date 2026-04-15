/**
 * Document title + meta tags (SEO / sharing) without changing React layout trees.
 */
import type { ContentSection, Page } from "@/lib/cms-store";

export const SITE_NAME = "AndaraLab";
const MAX_DESC = 165;

export function truncateMeta(s: string, max = MAX_DESC): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function ensureMetaName(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function ensureMetaProperty(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function extractDescriptionFromPageContent(content: ContentSection[] | undefined): string | undefined {
  if (!Array.isArray(content)) return undefined;
  for (const s of content) {
    if (s.type === "text" && typeof s.content === "string" && s.content.trim()) {
      return truncateMeta(s.content);
    }
    if (s.type === "hero" && typeof s.headline === "string" && s.headline.trim()) {
      return truncateMeta(s.headline);
    }
  }
  return undefined;
}

/**
 * Sets `document.title`, description, Open Graph, Twitter, and canonical link.
 */
export function applyDocumentSeo(opts: {
  /** Short page title (suffix added unless already branded) */
  title: string;
  description?: string;
  /** Current path e.g. /macro — for og:url and canonical */
  pathname?: string;
}) {
  const raw = (opts.title ?? "").trim() || SITE_NAME;
  const fullTitle =
    raw === SITE_NAME || raw.endsWith(` | ${SITE_NAME}`) ? raw : `${raw} | ${SITE_NAME}`;
  document.title = fullTitle;

  if (opts.description?.trim()) {
    const d = truncateMeta(opts.description);
    ensureMetaName("description", d);
    ensureMetaProperty("og:description", d);
    ensureMetaName("twitter:description", d);
  }

  ensureMetaProperty("og:title", fullTitle);
  ensureMetaName("twitter:title", fullTitle);
  ensureMetaProperty("og:type", "website");
  ensureMetaName("twitter:card", "summary_large_image");

  if (typeof window !== "undefined" && opts.pathname != null && opts.pathname !== "") {
    const path = opts.pathname.startsWith("/") ? opts.pathname : `/${opts.pathname}`;
    const url = `${window.location.origin}${path}`;
    ensureMetaProperty("og:url", url);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }
}

export function seoFromCmsPage(page: Page): { title: string; description?: string } {
  const title = (page.title ?? "").trim() || SITE_NAME;
  const description =
    (page.description && page.description.trim()) ||
    extractDescriptionFromPageContent(page.content) ||
    undefined;
  return { title, description };
}
