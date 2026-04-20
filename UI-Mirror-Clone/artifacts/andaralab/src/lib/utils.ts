import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DataUnitType } from "./cms-store"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Thousands with `.`, decimal with `.` (Indonesian thousands + ASCII decimal). */
export function formatIdNumber(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return String(value)
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  if (maxFractionDigits === 0) {
    const n = Math.round(abs)
    return sign + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }
  const fixed = abs.toFixed(maxFractionDigits)
  const [intPart, decPart] = fixed.split(".")
  const intDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return sign + intDots + "." + decPart
}

function appendDisplayUnit(base: string, unitType: DataUnitType, unit: string): string {
  const u = unit.trim()
  if (!u) return base
  if (unitType === "currency_idr" || unitType === "currency_usd") return base
  if (unitType === "percent" && u === "%") return base
  return `${base} ${u}`
}

/**
 * Format a numeric value according to its unit type.
 * Uses dot as thousands separator; optional `unit` is appended for number/custom (e.g. "Ribu USD").
 */
export function formatValue(value: number, unitType: DataUnitType, unit: string = ""): string {
  if (!Number.isFinite(value)) return String(value)

  const fmtInt = (n: number) => formatIdNumber(n, 0)
  const fmt = (n: number, decimals = 2) => formatIdNumber(n, decimals)

  switch (unitType) {
    case "percent":
      return appendDisplayUnit(`${fmt(value)}%`, unitType, unit)

    case "currency_idr": {
      let base: string
      if (Math.abs(value) >= 1_000_000_000_000) base = `Rp ${fmt(value / 1_000_000_000_000)} T`
      else if (Math.abs(value) >= 1_000_000_000) base = `Rp ${fmt(value / 1_000_000_000)} M`
      else if (Math.abs(value) >= 1_000_000) base = `Rp ${fmt(value / 1_000_000)}Jt`
      else base = `Rp ${fmtInt(value)}`
      return appendDisplayUnit(base, unitType, unit)
    }

    case "currency_usd": {
      let base: string
      if (Math.abs(value) >= 1_000_000_000_000) base = `USD ${fmt(value / 1_000_000_000_000)} T`
      else if (Math.abs(value) >= 1_000_000_000) base = `USD ${fmt(value / 1_000_000_000)} B`
      else if (Math.abs(value) >= 1_000_000) base = `USD ${fmt(value / 1_000_000)} M`
      else base = `USD ${fmtInt(value)}`
      return appendDisplayUnit(base, unitType, unit)
    }

    case "number":
      return appendDisplayUnit(
        Number.isInteger(value) ? fmtInt(value) : fmt(value),
        unitType,
        unit
      )

    case "custom":
    default:
      return appendDisplayUnit(
        Number.isInteger(value) ? fmtInt(value) : fmt(value),
        unitType,
        unit
      )
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
