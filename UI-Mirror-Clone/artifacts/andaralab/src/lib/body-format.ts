export type ListKind = "bullet" | "numbered" | "alpha";

const BULLET_RE = /^(\*|-)\s+/;
const NUMBERED_RE = /^(\d+)\.\s+/;
const ALPHA_RE = /^([a-zA-Z])\.\s+/;

export function stripListPrefix(line: string): string {
  return line.replace(BULLET_RE, "").replace(NUMBERED_RE, "").replace(ALPHA_RE, "");
}

export function getNextNumber(lines: string[], idx: number): number {
  for (let i = idx - 1; i >= 0; i--) {
    const t = lines[i]?.trim() ?? "";
    if (!t) continue;
    const m = t.match(/^(\d+)\.\s+/);
    if (m) return parseInt(m[1], 10) + 1;
    if (!NUMBERED_RE.test(t) && !BULLET_RE.test(t) && !ALPHA_RE.test(t)) break;
  }
  return 1;
}

export function getNextAlpha(lines: string[], idx: number): string {
  for (let i = idx - 1; i >= 0; i--) {
    const t = lines[i]?.trim() ?? "";
    if (!t) continue;
    const m = t.match(/^([a-zA-Z])\.\s+/);
    if (m) {
      const c = m[1].toLowerCase().charCodeAt(0);
      return `${String.fromCharCode(c + 1)}.`;
    }
    if (!NUMBERED_RE.test(t) && !BULLET_RE.test(t) && !ALPHA_RE.test(t)) break;
  }
  return "a.";
}

export function applyListFormat(
  line: string,
  kind: ListKind,
  lines: string[],
  idx: number,
): string {
  const stripped = stripListPrefix(line);
  if (kind === "bullet") {
    if (BULLET_RE.test(line)) return stripped;
    return `* ${stripped}`;
  }
  if (kind === "numbered") {
    if (NUMBERED_RE.test(line)) return stripped;
    return `${getNextNumber(lines, idx)}. ${stripped}`;
  }
  if (ALPHA_RE.test(line)) return stripped;
  return `${getNextAlpha(lines, idx)} ${stripped}`;
}

export function getCursorLineIndex(text: string, cursorPos: number): number {
  const lines = text.split("\n");
  let chars = 0;
  for (let i = 0; i < lines.length; i++) {
    chars += lines[i].length + 1;
    if (chars > cursorPos) return i;
  }
  return Math.max(0, lines.length - 1);
}
