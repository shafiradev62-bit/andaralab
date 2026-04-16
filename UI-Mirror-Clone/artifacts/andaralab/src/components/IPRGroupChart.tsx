import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  ResponsiveContainer, Tooltip, CartesianGrid, Brush,
} from "recharts";
import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { useChartZoom } from "@/hooks/useChartZoom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IPRSeries {
  /** Label di bawah grafik, e.g. "IPR Suku Cadang dan Aksesori" */
  label: string;
  /** Data points: { period: "Jan", value: 10.5 } */
  data: { period: string; value: number }[];
  /** Tandai titik terakhir sebagai prakiraan */
  isPrakiraan?: boolean;
}

interface Props {
  /** Judul grafik, e.g. "Grafik 3" */
  chartNumber?: string;
  /** Judul lengkap */
  title?: string;
  /** Satuan sumbu Y */
  unit?: string;
  /** Catatan kaki */
  footnote?: string;
  /** Array series per kategori */
  series: IPRSeries[];
}

// ─── Tooltip kecil ────────────────────────────────────────────────────────────

function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow text-[10px] px-2 py-1 rounded-sm">
      <p className="font-semibold text-gray-700 mb-0.5">{label}</p>
      <p className="text-[#C0392B] font-bold">{payload[0]?.value?.toFixed(1)}</p>
    </div>
  );
}

// ─── Expanded full-size chart modal ──────────────────────────────────────────

function ExpandedChart({ series, onClose }: { series: IPRSeries; onClose: () => void }) {
  const values = series.data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(Math.abs(max - min) * 0.25, 3);
  const yMin = Math.floor((min - pad) / 5) * 5;
  const yMax = Math.ceil((max + pad) / 5) * 5;

  const { brushRange, setBrushRange, zoomProps } = useChartZoom(series.data.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 shadow-xl p-5 w-[90vw] max-w-[700px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-gray-800 leading-tight">{series.label}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mb-3">Scroll / pinch untuk zoom · drag slider untuk navigasi</p>
        <div {...zoomProps}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series.data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => v.toFixed(0)} />
              <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={0.8} strokeDasharray="3 3" />
              <Tooltip content={<MiniTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#C0392B" strokeWidth={2} dot={{ r: 3, fill: "#C0392B", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#C0392B", stroke: "#fff", strokeWidth: 1 }} />
              <Brush
                dataKey="period"
                height={22}
                stroke="#E5E7EB"
                fill="#F9FAFB"
                travellerWidth={6}
                tickFormatter={() => ""}
                startIndex={brushRange.startIndex}
                endIndex={brushRange.endIndex}
                onChange={(r) => setBrushRange({ startIndex: r.startIndex, endIndex: r.endIndex })}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Satu mini chart ──────────────────────────────────────────────────────────

function MiniLineChart({ series, onExpand }: { series: IPRSeries; onExpand: () => void }) {
  const lastPoint = series.data[series.data.length - 1];
  const lastValue = lastPoint?.value;

  // Hitung domain Y dengan padding
  const values = series.data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(Math.abs(max - min) * 0.25, 3);
  const yMin = Math.floor((min - pad) / 5) * 5;
  const yMax = Math.ceil((max + pad) / 5) * 5;

  const { brushRange, setBrushRange, zoomProps } = useChartZoom(series.data.length);

  return (
    <div className="flex flex-col relative group" style={{ minWidth: 0 }}>
      <button
        onClick={onExpand}
        className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-sm p-0.5"
        title="Zoom"
      >
        <ZoomIn className="w-2.5 h-2.5 text-gray-500" />
      </button>
      <div {...zoomProps}>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart
            data={series.data}
            margin={{ top: 14, right: 18, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 8, fill: "#9CA3AF" }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 8, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={28}
              tickFormatter={(v) => v.toFixed(0)}
            />
            <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={0.8} strokeDasharray="3 3" />
            <Tooltip content={<MiniTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#C0392B"
              strokeWidth={1.5}
              dot={(props: any) => {
                const { cx, cy, index } = props;
                const isLast = index === series.data.length - 1;
                if (!isLast) return <circle key={`dot-${index}`} cx={cx} cy={cy} r={2} fill="#C0392B" stroke="none" />;
                return (
                  <circle
                    key={`dot-last-${index}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#C0392B"
                    stroke="#fff"
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={{ r: 4, fill: "#C0392B", stroke: "#fff", strokeWidth: 1 }}
            />
            <Brush
              dataKey="period"
              height={14}
              stroke="#E5E7EB"
              fill="#F9FAFB"
              travellerWidth={4}
              tickFormatter={() => ""}
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(r) => setBrushRange({ startIndex: r.startIndex, endIndex: r.endIndex })}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Label nilai terakhir */}
      {lastValue !== undefined && (
        <div className="text-center -mt-1 mb-1">
          <span
            className="text-[10px] font-bold"
            style={{ color: lastValue >= 0 ? "#1a3a5c" : "#C0392B" }}
          >
            {lastValue > 0 ? "+" : ""}
            {lastValue.toFixed(1)}
          </span>
        </div>
      )}

      {/* Label kategori */}
      <p className="text-center text-[9px] text-gray-500 leading-tight px-1 mt-0.5">
        {series.label}
        {series.isPrakiraan && <span className="text-gray-400">*</span>}
      </p>
    </div>
  );
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

export default function IPRGroupChart({
  chartNumber = "Grafik",
  title = "Pertumbuhan IPR Menurut Kelompok (%, yoy)",
  unit = "%, yoy",
  footnote = "*) Angka Prakiraan",
  series,
}: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (!series || series.length === 0) return null;

  return (
    <div className="bg-white border border-[#E5E7EB] w-full">
      {expandedIdx !== null && (
        <ExpandedChart series={series[expandedIdx]} onClose={() => setExpandedIdx(null)} />
      )}
      {/* Header merah */}
      <div className="flex items-center gap-0">
        <div className="bg-[#C0392B] text-white text-[13px] font-bold px-4 py-2.5 whitespace-nowrap">
          {chartNumber}
        </div>
        <div className="bg-white border-l border-[#E5E7EB] px-4 py-2.5 flex-1">
          <span className="text-[13px] font-semibold text-gray-800">{title}</span>
        </div>
      </div>

      {/* Satuan */}
      <div className="px-4 pt-2">
        <span className="text-[9px] text-gray-400">{unit}</span>
      </div>

      {/* Grid mini charts */}
      <div
        className="grid px-2 pb-2 pt-1 gap-x-1 gap-y-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(series.length, 7)}, minmax(0, 1fr))`,
        }}
      >
        {series.map((s, i) => (
          <MiniLineChart key={i} series={s} onExpand={() => setExpandedIdx(i)} />
        ))}
      </div>

      {/* Footnote */}
      {footnote && (
        <div className="px-4 pb-3">
          <span className="text-[9px] text-gray-400 italic">{footnote}</span>
        </div>
      )}
    </div>
  );
}
