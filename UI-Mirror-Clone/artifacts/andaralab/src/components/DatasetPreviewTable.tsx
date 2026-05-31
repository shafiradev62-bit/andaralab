import type { ChartDataset } from "@/lib/cms-store";
import { formatValue } from "@/lib/utils";

type Locale = "en" | "id";

function getColumnLabel(dataset: ChartDataset, colKey: string, locale: Locale): string {
  if (dataset.columnNames) {
    const primary = locale === "id" ? dataset.columnNames.id : dataset.columnNames.en;
    const idx = dataset.columns.indexOf(colKey);
    if (primary && primary[idx] !== undefined) return primary[idx];
    const fallback = dataset.columnNames.en ?? dataset.columnNames.id;
    if (fallback && fallback[idx] !== undefined) return fallback[idx];
  }
  return colKey;
}

/** Parse ID-formatted numeric strings (ribuan pakai titik) untuk preview — tidak mengubah data sumber. */
function parseCellNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return null;
  const noThousands = s.replace(/\./g, "").replace(/\s/g, "");
  const normalized = noThousands.includes(",")
    ? noThousands.replace(",", ".")
    : noThousands;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

interface Props {
  dataset: ChartDataset;
  locale: Locale;
  /** Tinggi area isi tabel (scroll vertikal); header tetap di atas. */
  maxBodyHeight?: string;
}

/**
 * Tabel preview read-only untuk halaman publik (Data Hub).
 * Header sticky, hanya badan tabel yang discroll — tanpa mengubah data.
 */
export default function DatasetPreviewTable({
  dataset,
  locale,
  maxBodyHeight = "min(70vh, 560px)",
}: Props) {
  const cols = dataset.columns;
  const tableStyle = dataset.tableStyle;
  const styles = {
    headerBg: tableStyle?.headerBg ?? "#E67E22",
    headerText: tableStyle?.headerText ?? "#FFFFFF",
    headerBorder: tableStyle?.headerBorder ?? "#CA6F1E",
    rowOddBg: tableStyle?.rowOddBg ?? "#FFFFFF",
    rowEvenBg: tableStyle?.rowEvenBg ?? "#F8F9FA",
    rowHoverBg: tableStyle?.rowHoverBg ?? "#FFF4E6",
    cellBorder: tableStyle?.cellBorder ?? "#ECECEC",
    containerBg: tableStyle?.containerBg ?? "#FFFFFF",
    containerBorder: tableStyle?.containerBorder ?? "#E67E22",
  };

  return (
    <div
      className="rounded-lg shadow-sm overflow-hidden"
      style={{ backgroundColor: styles.containerBg, border: `1px solid ${styles.containerBorder}` }}
    >
      <div
        className="overflow-auto overscroll-contain [scrollbar-gutter:stable]"
        style={{ maxHeight: maxBodyHeight }}
      >
        <table className="w-full min-w-max border-collapse text-[13px]">
          <thead className="sticky top-0 z-20">
            <tr>
              {cols.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="text-left font-semibold uppercase tracking-wide px-3 py-3 border-b-2 whitespace-nowrap shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[11px] md:text-[11.5px] first:rounded-tl-lg last:rounded-tr-lg"
                  style={{
                    background: `linear-gradient(to bottom, ${styles.headerBg}, ${styles.headerBg})`,
                    color: styles.headerText,
                    borderBottomColor: styles.headerBorder,
                  }}
                >
                  {getColumnLabel(dataset, col, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.rows.map((row, i) => {
              const zebra = i % 2 === 0 ? styles.rowOddBg : styles.rowEvenBg;
              return (
                <tr key={i} className="transition-colors" style={{ backgroundColor: zebra }}>
                  {cols.map((col, colIdx) => {
                    const val = row[col];
                    const isPeriod = colIdx === 0;
                    const parsed = !isPeriod ? parseCellNumber(val) : null;
                    const isNumeric = !isPeriod && parsed !== null;

                    const display = isPeriod
                      ? val != null && val !== ""
                        ? String(val)
                        : "—"
                      : isNumeric
                        ? formatValue(parsed!, dataset.unitType, "")
                        : val != null && val !== ""
                          ? String(val)
                          : "—";

                    return (
                      <td
                        key={col}
                        className={`px-3 py-2.5 text-gray-900 ${
                          isPeriod
                            ? "text-left font-medium whitespace-nowrap"
                            : "text-right tabular-nums font-mono text-[12.5px] min-w-[7rem]"
                        }`}
                        style={{
                          borderBottom: `1px solid ${styles.cellBorder}`,
                        }}
                        onMouseEnter={(e) => {
                          const tr = e.currentTarget.parentElement;
                          if (tr) tr.style.backgroundColor = styles.rowHoverBg;
                        }}
                        onMouseLeave={(e) => {
                          const tr = e.currentTarget.parentElement;
                          if (tr) tr.style.backgroundColor = zebra;
                        }}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
