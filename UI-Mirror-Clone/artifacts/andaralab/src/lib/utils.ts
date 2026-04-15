import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { DataUnitType } from "./cms-store"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a numeric value according to its unit type.
 * - percent: shows value with % suffix (e.g. "5.75%")
 * - currency_idr: formats with Rp prefix, decimal digits (e.g. "Rp 16,620")
 * - currency_usd: formats with USD prefix (e.g. "USD 20.5 B")
 * - number: comma-separated integer (e.g. "548,648")
 * - custom: appends the raw `unit` label as-is (e.g. "548,648 000 Barel / MMscf")
 */
export function formatValue(value: number, unitType: DataUnitType, unit: string = ""): string {
  if (!Number.isFinite(value)) return String(value)

  switch (unitType) {
    case "percent":
      return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

    case "currency_idr": {
      if (Math.abs(value) >= 1_000_000_000_000) {
        return `Rp ${(value / 1_000_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`
      }
      if (Math.abs(value) >= 1_000_000_000) {
        return `Rp ${(value / 1_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`
      }
      if (Math.abs(value) >= 1_000_000) {
        return `Rp ${(value / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}Jt`
      }
      return `Rp ${value.toLocaleString()}`
    }

    case "currency_usd": {
      if (Math.abs(value) >= 1_000_000_000_000) {
        return `USD ${(value / 1_000_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`
      }
      if (Math.abs(value) >= 1_000_000_000) {
        return `USD ${(value / 1_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B`
      }
      if (Math.abs(value) >= 1_000_000) {
        return `USD ${(value / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`
      }
      return `USD ${value.toLocaleString()}`
    }

    case "number":
      return value.toLocaleString()

    case "custom":
    default:
      return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString()
  }
}

/** Returns the default unitType inferred from the raw unit string. */
export function inferUnitType(unit: string): DataUnitType {
  if (unit === "%") return "percent"
  if (unit === "IDR" || unit.includes("Rp")) return "currency_idr"
  if (unit.includes("USD") || unit.includes("$")) return "currency_usd"
  if (unit && unit !== "number") return "custom"
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
