import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DataUnitType } from "./cms-store"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Global formatter following Indonesian standard:
 * DOT (.) as thousand separator, COMMA (,) as decimal separator.
 * Example: 480.116 (for 480k)
 */
export function formatNumberID(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return String(value);
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Thousands with `.`, decimal with `,` (Full Indonesian format). */
export function formatIdNumber(value: number, maxFractionDigits = 2): string {
  return formatNumberID(value, maxFractionDigits);
}

function appendDisplayUnit(base: string, unitType: DataUnitType, unit: string): string {
  const u = unit.trim();
  if (!u) return base;
  
  // Rule: If unit is already in base (e.g. currency labels), don't append again.
  // But for "number" or "custom", we strictly append the unit.
  if (unitType === "percent" && (u === "%" || base.endsWith("%"))) return base;
  if (unitType === "currency_idr" && (base.startsWith("Rp") || u === "Rp" || u === "IDR")) return base;
  if (unitType === "currency_usd" && (base.startsWith("USD") || u === "USD" || u === "$")) return base;

  return `${base} ${u}`;
}

/**
 * Format a numeric value according to its unit type.
 * Uses dot as thousands separator; unit is appended consistently.
 */
export function formatValue(value: number, unitType: DataUnitType, unit: string = ""): string {
  if (!Number.isFinite(value)) return String(value);

  // For chart values, we often want fewer decimals if they are large
  const fmt = (n: number, decimals = 2) => formatNumberID(n, decimals);
  const fmtInt = (n: number) => formatNumberID(n, 0);

  switch (unitType) {
    case "percent":
      return `${fmt(value)}%`;

    case "currency_idr": {
      let base: string;
      const abs = Math.abs(value);
      if (abs >= 1_000_000_000_000) base = `Rp ${fmt(value / 1_000_000_000_000)} T`;
      else if (abs >= 1_000_000_000) base = `Rp ${fmt(value / 1_000_000_000)} M`;
      else if (abs >= 1_000_000) base = `Rp ${fmt(value / 1_000_000)} Jt`;
      else base = `Rp ${fmtInt(value)}`;
      return appendDisplayUnit(base, unitType, unit);
    }

    case "currency_usd": {
      let base: string;
      const abs = Math.abs(value);
      if (abs >= 1_000_000_000_000) base = `USD ${fmt(value / 1_000_000_000_000)} T`;
      else if (abs >= 1_000_000_000) base = `USD ${fmt(value / 1_000_000_000)} B`;
      else if (abs >= 1_000_000) base = `USD ${fmt(value / 1_000_000)} M`;
      else base = `USD ${fmtInt(value)}`;
      return appendDisplayUnit(base, unitType, unit);
    }

    case "number":
    case "custom":
    default:
      return appendDisplayUnit(
        Number.isInteger(value) ? fmtInt(value) : fmt(value),
        unitType,
        unit
      );
  }
}

/** Returns the default unitType inferred from the raw unit string. */
export function inferUnitType(unit: string): DataUnitType {
  const u = unit.trim()
  if (u === "%") return "percent"
  if (u === "IDR" || /\bRp\b/i.test(u)) return "currency_idr"
  // Avoid classifying "Ribu USD" / "ribu USD" as currency_usd (those are custom labels)
  if (/^\s*USD\s/i.test(u) || u === "USD" || u.includes("$")) return "currency_usd"
  if (u && u !== "number") return "custom"
  return "number"
}

/** Human-readable labels for each DataUnitType. */
export const UNIT_TYPE_LABELS: Record<DataUnitType, string> = {
  percent: "Percent (%)",
  currency_idr: "Currency — IDR (Rp)",
  currency_usd: "Currency — USD ($)",
  number: "General Number",
  custom: "Custom Unit",
}
