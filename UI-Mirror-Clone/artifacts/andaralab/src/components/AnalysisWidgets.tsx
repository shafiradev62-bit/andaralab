// AnalysisWidgets.tsx — Renderer for all analysis widget types
// Used by AnalysisPage.tsx for the public-facing analysis view

import { type AnalisisDeskriptif, type AnalysisWidget, type AnalysisMetric } from "@/lib/cms-store";
import {
  TrendingUp, TrendingDown, Minus,
  ArrowRight,
} from "lucide-react";

// Remap vivid/AI-style chart colors to AndaraLab professional palette
const COLOR_MAP: Record<string, string> = {
  "#0d7377": "#0d9fbf",  // teal
  "#1a3a5c": "#1a3a5c",  // navy (keep)
  "#e67e22": "#f59e0b",  // orange → gold
  "#2ecc71": "#10B981",  // green
  "#9b59b6": "#8b5cf6",   // purple
  "#3498db": "#3b82f6",   // bright blue
  "#e74c3c": "#ef4444",  // red → coral
  "#27ae60": "#10B981",   // green
  "#8e44ad": "#8b5cf6",  // purple
  "#16a085": "#0d9fbf",  // teal
  "#2980b9": "#2a5a8c",  // blue
  "#c0392b": "#ef4444",  // red → coral
  "#d35400": "#f59e0b",   // orange → gold
  "#f39c12": "#f59e0b",   // yellow → gold
  "#1abc9c": "#0d9fbf",  // teal
};

function remapColor(color?: string): string {
  if (!color) return "#1a3a5c";
  return COLOR_MAP[color.toLowerCase()] ?? color;
}

// ─── Trend Icon ────────────────────────────────────────────────────────────────

function TrendBadge({ trend, value }: { trend?: string; value?: string }) {
  if (!trend || trend === "neutral") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
        <Minus className="w-3 h-3" />
        {value || "—"}
      </span>
    );
  }
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-900 font-semibold">
        <TrendingUp className="w-3 h-3" />
        {value || "↑ Up"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-900 font-semibold">
      <TrendingDown className="w-3 h-3" />
      {value || "↓ Down"}
    </span>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCardWidget({ widget }: { widget: AnalysisWidget }) {
  const metrics = widget.metrics ?? [];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.id}
          className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">{m.label}</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">{m.value}</span>
            {m.unit && <span className="text-sm text-gray-400 font-medium">{m.unit}</span>}
          </div>
          <TrendBadge trend={m.trend} value={m.trendValue} />
          {m.note && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{m.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Distribution ─────────────────────────────────────────────────────────────

function DistributionWidget({ widget }: { widget: AnalysisWidget }) {
  const items = widget.distributionItems ?? [];
  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-4">
          {/* Label + percentage */}
          <div className="w-48 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800">{item.label}</span>
              <span className="text-xs text-gray-500 font-semibold">{item.percentage}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: remapColor(item.color),
                }}
              />
            </div>
          </div>
          {/* Value */}
          <div className="flex-shrink-0 text-sm text-gray-500 font-medium w-12 text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonWidget({ widget }: { widget: AnalysisWidget }) {
  const headers = widget.compareHeaders ?? ["Item", "Value"];
  const items = widget.compareItems ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 ${
                  i === 0 ? "w-40" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-semibold text-gray-800">{row.label}</td>
              {(row.values ?? []).map((v, vi) => (
                <td key={vi} className="px-4 py-3 text-gray-600">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Highlight / Callout ───────────────────────────────────────────────────────

function HighlightWidget({ widget }: { widget: AnalysisWidget }) {
  const color = remapColor(widget.calloutColor ?? "#1a3a5c");
  const text = widget.text ?? "";

  // Parse simple markdown-style bold **text** → <strong>
  const rendered = text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  return (
    <div
      className="rounded-xl px-6 py-5 border-l-4 flex items-start gap-4"
      style={{
        backgroundColor: `${color}0d`, // 5% opacity
        borderColor: color,
      }}
    >
      <div className="flex-shrink-0 mt-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <div className="text-sm leading-relaxed text-gray-700">{rendered}</div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChartWidget({ widget }: { widget: AnalysisWidget }) {
  const data = widget.barData ?? [];
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-36 flex-shrink-0 text-sm text-gray-700 font-medium text-right pr-2">
            {item.label}
          </div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
              style={{
                width: `${(item.value / maxVal) * 100}%`,
                backgroundColor: remapColor(item.color),
                minWidth: item.value > 0 ? "1.5rem" : "0",
              }}
            >
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {item.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChartWidget({ widget }: { widget: AnalysisWidget }) {
  const data = widget.barData ?? [];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Build SVG arc data
  const cx = 70, cy = 70, r = 55;
  let currentAngle = -90; // start at top

  const slices = data.map((item, i) => {
    const pct = total > 0 ? item.value / total : 0;
    const angle = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = angle > 180 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...item, d, pct };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      {/* SVG Donut */}
      <svg width="140" height="140" viewBox="0 0 140 140" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={remapColor(s.color)} />
        ))}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="text-lg font-bold fill-gray-800"
        >
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-xs fill-gray-500">
          Total
        </text>
      </svg>

      {/* Legend */}
      <div className="space-y-2 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: remapColor(s.color) }}
            />
            <span className="text-sm text-gray-700 flex-1">{s.label}</span>
            <span className="text-xs font-semibold text-gray-500">
              {s.value} ({Math.round(s.pct * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Text ──────────────────────────────────────────────────────────────

function CustomTextWidget({ widget }: { widget: AnalysisWidget }) {
  const text = widget.text ?? "";

  // Parse markdown: **bold**, *italic*, \n → <br/>
  const rendered = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    // Handle newlines
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });

  return (
    <div className="text-sm leading-relaxed text-gray-700 space-y-3">
      {rendered}
    </div>
  );
}

// ─── Widget Dispatcher ─────────────────────────────────────────────────────────

export default function AnalysisWidgetRenderer({ widget }: { widget: AnalysisWidget }) {
  switch (widget.type) {
    case "metric-card":
      return <MetricCardWidget widget={widget} />;
    case "distribution":
      return <DistributionWidget widget={widget} />;
    case "comparison":
      return <ComparisonWidget widget={widget} />;
    case "highlight":
      return <HighlightWidget widget={widget} />;
    case "bar-chart":
      return <BarChartWidget widget={widget} />;
    case "donut-chart":
      return <DonutChartWidget widget={widget} />;
    case "custom-text":
      return <CustomTextWidget widget={widget} />;
    default:
      return null;
  }
}
