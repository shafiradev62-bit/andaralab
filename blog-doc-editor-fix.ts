/** Convert CMS body lines (markdown-like) ↔ HTML for the doc editor. */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownInlineToHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function htmlInlineToMarkdown(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    if (node.tagName === "STRONG" || node.tagName === "B") {
      return `**${Array.from(node.childNodes).map(walk).join("")}**`;
    }
    if (node.tagName === "BR") return "";
    return Array.from(node.childNodes).map(walk).join("");
  };
  return walk(el).replace(/\s+/g, " ").trim();
}

function blockInnerText(el: HTMLElement): string {
  return htmlInlineToMarkdown(el.innerHTML);
}

/** Parse `[IMG: url]` body line; returns image URL or null. */
export function parseImgShortcode(line: string): string | null {
  if (typeof line !== "string") return null;
  const trimmed = line.trim();
  if (trimmed.startsWith("[IMG:") && trimmed.endsWith("]")) {
    return trimmed.substring(5, trimmed.length - 1).trim();
  }
  return null;
}

/**
 * Extract image src from any element.
 * Handles: <img>, <figure data-type="img">, <figure> containing <img>.
 */
function extractImgSrc(el: Element): string | null {
  const tag = el instanceof HTMLElement ? el.tagName.toLowerCase() : "";

  // Direct img element
  if (tag === "img") {
    return (el as HTMLImageElement).getAttribute("src")?.trim() || null;
  }

  // figure with data-type="img" — our canonical image block
  if (tag === "figure" && (el as HTMLElement).dataset.type === "img") {
    return (el as HTMLElement).querySelector("img")?.getAttribute("src")?.trim() || null;
  }

  // Any figure that contains an img and has no meaningful text
  if (tag === "figure") {
    const img = (el as HTMLElement).querySelector("img");
    if (img) {
      return img.getAttribute("src")?.trim() || null;
    }
  }

  return null;
}

/**
 * Check if an element is purely an image block (no real text content).
 * Returns the image src if yes, null otherwise.
 */
function elementAsImageBlock(el: HTMLElement): string | null {
  const tag = el.tagName.toLowerCase();

  // Always trust figure — it's our designated image container
  if (tag === "figure") {
    return extractImgSrc(el);
  }

  // For p/div/span: only treat as image block if the only meaningful content is an img
  if (tag === "p" || tag === "div" || tag === "span") {
    const imgs = el.querySelectorAll("img");
    if (imgs.length === 0) return null;
    // Strip all images and check if remaining text is empty
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("img").forEach((i) => i.remove());
    const remainingText = (clone.textContent ?? "").replace(/\u00a0/g, " ").trim();
    if (remainingText) return null; // has real text alongside image — not an image block
    return imgs[0].getAttribute("src")?.trim() || null;
  }

  return null;
}

export function bodyLinesToHtml(lines: string[]): string {
  const normalized = lines.length ? lines : [""];
  return normalized
    .map((line) => {
      const imgUrl = parseImgShortcode(line);
      if (imgUrl) {
        return `<figure data-type="img" class="my-6 border border-gray-200 rounded overflow-hidden"><img src="${escapeHtml(imgUrl)}" alt="" class="w-full h-auto" /></figure>`;
      }
      if (line.startsWith("### ")) {
        return `<h3>${markdownInlineToHtml(line.slice(4))}</h3>`;
      }
      if (line.startsWith("## ")) {
        return `<h2>${markdownInlineToHtml(line.slice(3))}</h2>`;
      }
      if (line.startsWith("# ")) {
        return `<h1>${markdownInlineToHtml(line.slice(2))}</h1>`;
      }
      if (line.startsWith("* ")) {
        return `<ul><li>${markdownInlineToHtml(line.slice(2))}</li></ul>`;
      }
      if (!line.trim()) {
        return "<p><br></p>";
      }
      return `<p>${markdownInlineToHtml(line)}</p>`;
    })
    .join("");
}

export function htmlToBodyLines(root: HTMLElement): string[] {
  const lines: string[] = [];

  const pushBlock = (line: string) => {
    lines.push(line);
  };

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent ?? "").trim();
      if (t) pushBlock(t);
      continue;
    }
    if (!(node instanceof HTMLElement)) continue;

    const tag = node.tagName.toLowerCase();

    // ── FIGURE / IMG — top-level image blocks ──────────────────────────────
    if (tag === "figure" || tag === "img") {
      const src = extractImgSrc(node);
      if (src) {
        pushBlock(`[IMG: ${src}]`);
        continue;
      }
    }

    // ── HEADINGS ────────────────────────────────────────────────────────────
    if (tag === "h1") { pushBlock(`# ${blockInnerText(node)}`); continue; }
    if (tag === "h2") { pushBlock(`## ${blockInnerText(node)}`); continue; }
    if (tag === "h3") { pushBlock(`### ${blockInnerText(node)}`); continue; }

    // ── LISTS ───────────────────────────────────────────────────────────────
    if (tag === "ul" || tag === "ol") {
      for (const li of Array.from(node.querySelectorAll(":scope > li"))) {
        pushBlock(`* ${blockInnerText(li as HTMLElement)}`);
      }
      continue;
    }

    // ── P / DIV — paragraphs, or browser-wrapped image blocks ───────────────
    if (tag === "p" || tag === "div" || tag === "span") {
      // Check if this element is actually just wrapping an image
      const imgSrc = elementAsImageBlock(node);
      if (imgSrc) {
        pushBlock(`[IMG: ${imgSrc}]`);
        continue;
      }

      // Check for nested figures (browser sometimes wraps figure in a div)
      const nestedFigures = Array.from(node.querySelectorAll("figure"));
      if (nestedFigures.length > 0) {
        // Extract text content without figures
        const clone = node.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("figure").forEach((f) => f.remove());
        const textPart = blockInnerText(clone);
        if (textPart) pushBlock(textPart);
        for (const fig of nestedFigures) {
          const src = extractImgSrc(fig);
          if (src) pushBlock(`[IMG: ${src}]`);
        }
        continue;
      }

      // Check for nested imgs (e.g. pasted content)
      const nestedImgs = Array.from(node.querySelectorAll("img"));
      if (nestedImgs.length > 0) {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("img").forEach((i) => i.remove());
        const textPart = blockInnerText(clone);
        if (textPart) pushBlock(textPart);
        for (const img of nestedImgs) {
          const src = img.getAttribute("src")?.trim();
          if (src) pushBlock(`[IMG: ${src}]`);
        }
        continue;
      }

      // Regular paragraph
      const text = blockInnerText(node);
      if (!text && (node.innerHTML === "<br>" || node.innerHTML === "<br/>")) {
        pushBlock("");
      } else if (text) {
        pushBlock(text);
      }
      continue;
    }

    // ── FALLBACK — any other element ─────────────────────────────────────────
    // Try as image block first
    const imgSrc = extractImgSrc(node);
    if (imgSrc) {
      pushBlock(`[IMG: ${imgSrc}]`);
      continue;
    }
    const fallback = blockInnerText(node);
    if (fallback) pushBlock(fallback);
  }

  return lines.length ? lines : [""];
}
