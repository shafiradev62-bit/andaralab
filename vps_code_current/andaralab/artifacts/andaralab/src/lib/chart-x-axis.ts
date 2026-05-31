/**
 * Mirrors api-server `fillYears` / X-axis normalization so monthly & quarterly
 * BPS-style tables get implicit years filled without reordering rows.
 */
const YEAR_RE = /\b(19|20)\d{2}\b/;

function fillYears(xvals: string[]): string[] {
  let currentYear: string | null = null;
  return xvals.map((v) => {
    const cleaned = String(v).trim().replace(/_\d+$/g, "");
    const m = cleaned.match(YEAR_RE);
    if (m) {
      currentYear = m[0];
      return cleaned;
    }
    return currentYear ? `${currentYear} ${cleaned}` : cleaned;
  });
}

/** Returns new row objects with the first column (X) filled when year is omitted. */
export function fillMissingYearsOnRows<T extends Record<string, unknown>>(
  rows: T[],
  xKey: string
): T[] {
  if (!rows.length) return rows;
  const xvals = rows.map((r) => String(r[xKey] ?? ""));
  const hasYear = xvals.some((v) => YEAR_RE.test(v));
  const noYear = xvals.some((v) => !YEAR_RE.test(v));
  if (!(hasYear && noYear)) return rows;
  const filled = fillYears(xvals);
  return rows.map((r, i) => ({ ...r, [xKey]: filled[i] } as T));
}
