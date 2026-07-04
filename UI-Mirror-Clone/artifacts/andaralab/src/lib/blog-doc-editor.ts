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

function imgSrcFromElement(el: Element): string | null {
  if (el instanceof HTMLImageElement) {
    return el.getAttribute("src")?.trim() || null;
  }
  if (el instanceof HTMLElement) {
    const tag = el.tagName.toLowerCase();
    if (tag === "figure" || el.dataset.type === "img") {
      return el.querySelector("img")?.getAttribute("src")?.trim() || null;
    }
  }
  return null;
}

/** Detect image-only blocks (figure/img), including when wrapped by contentEditable div/p. */
function imageSrcFromBlock(el: HTMLElement): string | null {
  const direct = imgSrcFromElement(el);
  if (direct) return direct;

  const imgs = el.querySelectorAll("img");
  if (imgs.length !== 1) return null;

  const text = (el.textContent ?? "").replace(/\u00a0/g, " ").trim();
  if (text) return null;

  return imgs[0].getAttribute("src")?.trim() || null;
}

export function bodyLinesToHtml(lines: string[]): string {
  const normalized = lines.length ? lines : [""];
  return normalized
    .map((line) => {
      const imgUrl = parseImgShortcode(line);
      if (imgUrl) {
        return `<figure data-type="img" contenteditable="false" class="my-6 border border-gray-200 rounded overflow-hidden"><img src="${escapeHtml(imgUrl)}" alt="" class="w-full h-auto" /></figure>`;
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

    if (tag === "figure" || tag === "img") {
      const src = imageSrcFromBlock(node);
      // Safety net: never store base64 data URLs — they can be 50MB+ and break saves
      if (src && !src.startsWith("data:")) {
        pushBlock(`[IMG: ${src.trim()}]`);
      }
      continue;
    }

    if (tag === "h1") {
      pushBlock(`# ${blockInnerText(node)}`);
      continue;
    }
    if (tag === "h2") {
      pushBlock(`## ${blockInnerText(node)}`);
      continue;
    }
    if (tag === "h3") {
      pushBlock(`### ${blockInnerText(node)}`);
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      for (const li of Array.from(node.querySelectorAll(":scope > li"))) {
        pushBlock(`* ${blockInnerText(li as HTMLElement)}`);
      }
      continue;
    }

    // Defensive check: extract any nested media from any element (e.g. pasted content)
    const nestedMedia = Array.from(node.querySelectorAll("figure, img"));
    if (nestedMedia.length > 0) {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("figure, img").forEach((el) => el.remove());
      const textPart = blockInnerText(clone);
      if (textPart) pushBlock(textPart);
      for (const el of nestedMedia) {
        const src = imgSrcFromElement(el as HTMLElement);
        // Safety net: never store base64 data URLs
        if (src && !src.startsWith("data:")) pushBlock(`[IMG: ${src.trim()}]`);
      }
      continue;
    }

    if (tag === "p" || tag === "div") {
      const text = blockInnerText(node);
      if (!text && (node.innerHTML === "<br>" || node.innerHTML === "<br/>")) {
        pushBlock("");
      } else if (text) {
        pushBlock(text);
      }
      continue;
    }

    const imageSrc = imageSrcFromBlock(node);
    if (imageSrc) {
      pushBlock(`[IMG: ${imageSrc}]`);
      continue;
    }

    const fallback = blockInnerText(node);
    if (fallback) pushBlock(fallback);
  }

  return lines.length ? lines : [""];
}
