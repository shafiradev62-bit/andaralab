import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart,
  Label, PieChart, Pie, Cell, Brush
} from "recharts";
import { ChartDataset } from "@/lib/cms-store";
import { formatValue } from "@/lib/utils";
import { useLocale } from "@/lib/locale";
import { useState } from "react";

// Andara Lab professional palette — data visualization colors
export const CHART_PALETTE = [
  "#1a3a5c", // navy
  "#2a5a8c", // blue
  "#0d9fbf", // teal
  "#3b82f6", // bright blue
  "#f59e0b", // gold
  "#ef4444", // coral/red
  "#22c55e", // green
  "#8b5cf6", // purple
];

const DEFAULT_COLORS = CHART_PALETTE;

interface Props {
  dataset: ChartDataset;
  height?: number;
}

// Resolve color: use dataset.colors[i] if available, else DEFAULT_COLORS
function getColor(dataset: ChartDataset, i: number): string {
  if (dataset.colors && dataset.colors[i]) return dataset.colors[i];
  return DEFAULT_COLORS[i % DEFAULT_COLORS.length];
}

/** Get display name for a column, respecting current locale */
function getColumnLabel(dataset: ChartDataset, colKey: string): string {
  if (dataset.columnNames) {
    const localeNames = dataset.columnNames.en ?? dataset.columnNames.id;
    const idx = dataset.columns.indexOf(colKey);
    if (localeNames && localeNames[idx] !== undefined) {
      return localeNames[idx];
    }
  }
  return colKey;
}

/** 
 * Parse period labels like "2020 I" or "Jan 2024" 
 * Returns { year: string, period: string } 
 */
function parseXLabel(val: string) {
  const parts = String(val).trim().split(/\s+/);
  if (parts.length === 2) {
    const yearIdx = parts.findIndex(p => /^\d{4}$/.test(p));
    if (yearIdx !== -1) {
      return {
        year: parts[yearIdx],
        period: parts[yearIdx === 0 ? 1 : 0]
      };
    }
  }
  return { year: null, period: val };
}

function CustomTooltip({ active, payload, label, dataset, columnNames }: { active?: boolean; payload?: any[]; label?: string; dataset: ChartDataset; columnNames?: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] shadow-lg px-4 py-3 rounded-sm min-w-[160px] z-50">
      <p className="text-[12px] font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any, i: number) => {
        const displayName = columnNames?.[p.dataKey] ?? p.dataKey;
        const unitType = p.unitType ?? dataset.unitType;
        const unit = p.unit ?? dataset.unit;
        
        return (
          <div key={i} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-[11.5px] text-gray-500">{displayName}</span>
            </div>
            <span className="text-[12px] font-semibold text-gray-900">
              {typeof p.value === "number"
                ? formatValue(p.value, unitType, unit)
                : p.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const CustomXAxisTick = (props: any) => {
  const { x, y, payload, index, rows } = props;
  const { year, period } = parseXLabel(payload.value);
  
  // Logic to only show year once per group (at the start of year group)
  let showYear = false;
  if (year && index >= 0) {
    const xKey = Object.keys(rows[0])[0]; // Assume first key is X-axis
    const prev = index > 0 ? parseXLabel(String(rows[index - 1][xKey])).year : null;
    showYear = year !== prev;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#6B7280" fontSize={10} fontWeight="500">
        {period}
      </text>
      {showYear && (
        <text x={0} y={0} dy={28} textAnchor="start" fill="#374151" fontSize={10} fontWeight="600">
          {year}
        </text>
      )}
    </g>
  );
};

// Brush styling shared across all chart types
const BRUSH_STYLE = {
  stroke: "#E5E7EB",
  fill: "#F9FAFB",
  height: 24,
};

export default function InteractiveChart({ dataset, height = 280 }: Props) {
  const { locale } = useLocale();
  const [brushRange, setBrushRange] = useState<{ startIndex?: number; endIndex?: number }>({});
  const dataKeys = dataset.columns.slice(1);
  const xKey = dataset.columns[0];

  const columnNameMap: Record<string, string> = {};
  for (const col of dataset.columns) {
    columnNameMap[col] = getColumnLabel(dataset, col);
  }

  const data = dataset.rows.map((r) => {
    const obj: Record<string, any> = {};
    for (const c of dataset.columns) obj[c] = r[c];
    return obj;
  });

  const commonProps = {
    data,
    margin: { top: 25, right: 30, left: 0, bottom: 25 },
  };

  const axisStyle = {
    tick: { fontSize: 10, fill: "#9CA3AF" },
    axisLine: { stroke: "#E5E7EB" },
    tickLine: false,
  };

  // Y-axis domain config — only applied to the main YAxis
  const yAxisDomain: [number | string, number | string] = [
    dataset.yAxisMin !== undefined ? dataset.yAxisMin : "auto",
    dataset.yAxisMax !== undefined ? dataset.yAxisMax : "auto",
  ];

  // Determine if we have a "Year Period" format for special XAxis rendering
  const hasYearGroup = data.length > 0 && parseXLabel(String(data[0][xKey])).year !== null;

  const renderXAxis = () => (
    <XAxis
      dataKey={xKey}
      {...axisStyle}
      interval={0}
      height={60}
      tick={<CustomXAxisTick rows={data} />}
    />
  );

  const renderDefaultXAxis = () => (
    <XAxis dataKey={xKey} {...axisStyle} />
  );

  const xAxis = hasYearGroup ? renderXAxis() : renderDefaultXAxis();

  if (dataset.chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height + 30}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          {xAxis}
          <YAxis {...axisStyle} width={45} domain={yAxisDomain} />
          <Tooltip content={<CustomTooltip dataset={dataset} columnNames={columnNameMap} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend
            verticalAlign="bottom"
            align="left"
            formatter={(value) => columnNameMap[value] ?? value}
            wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 15 }}
            iconType="rect"
            iconSize={12}
          />
          {dataKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={getColor(dataset, i)} radius={[2, 2, 0, 0]} maxBarSize={40} name={columnNameMap[key] ?? key} />
          ))}
          <Brush
            dataKey={xKey}
            height={BRUSH_STYLE.height}
            stroke={BRUSH_STYLE.stroke}
            fill={BRUSH_STYLE.fill}
            travellerWidth={6}
            startIndex={brushRange.startIndex}
            endIndex={brushRange.endIndex}
            onChange={(range) => setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })}
            tickFormatter={() => ""}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (dataset.chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={height + 30}>
        <AreaChart {...commonProps}>
          <defs>
            {dataKeys.map((key, i) => (
              <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getColor(dataset, i)} stopOpacity={0.15} />
                <stop offset="95%" stopColor={getColor(dataset, i)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          {xAxis}
          <YAxis {...axisStyle} width={45} domain={yAxisDomain} />
          <Tooltip content={<CustomTooltip dataset={dataset} columnNames={columnNameMap} />} />
          <Legend
            verticalAlign="bottom"
            align="left"
            formatter={(value) => columnNameMap[value] ?? value}
            wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 15 }}
            iconType="circle"
            iconSize={8}
          />
          {dataKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getColor(dataset, i)}
              strokeWidth={2}
              fill={`url(#grad-${i})`}
              dot={{ r: 3, strokeWidth: 0, fill: getColor(dataset, i) }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              name={columnNameMap[key] ?? key}
            />
          ))}
          <Brush
            dataKey={xKey}
            height={BRUSH_STYLE.height}
            stroke={BRUSH_STYLE.stroke}
            fill={BRUSH_STYLE.fill}
            travellerWidth={6}
            startIndex={brushRange.startIndex}
            endIndex={brushRange.endIndex}
            onChange={(range) => setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })}
            tickFormatter={() => ""}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (dataset.chartType === "combo") {
    // Advanced Combo: Dual Y-Axis with optional GDP breakdown section
    // Use explicit comboConfig if provided, otherwise auto-detect
    let finalBarKeys: string[];
    let finalLineKeys: string[];

    if (dataset.comboConfig && dataset.comboConfig.barColumns.length > 0) {
      // Explicit config — use comboConfig.barColumns / lineColumns
      finalBarKeys = dataset.comboConfig.barColumns.filter(k => dataKeys.includes(k));
      finalLineKeys = dataset.comboConfig.lineColumns.filter(k => dataKeys.includes(k));
    } else {
      // Auto-detect: columns containing "%" or "Perubahan" → RHS line
      const isRHS = (key: string) => key.toLowerCase().includes("%") || key.toLowerCase().includes("perubahan");
      const detectedBars = dataKeys.filter(k => !isRHS(k));
      const detectedLines = dataKeys.filter(k => isRHS(k));
      finalBarKeys = detectedLines.length > 0 ? detectedBars : dataKeys.slice(0, -1);
      finalLineKeys = detectedLines.length > 0 ? detectedLines : dataKeys.slice(-1);
    }

    const leftLabel = dataset.comboConfig?.leftLabel ?? "(Indeks)";
    const rightLabel = dataset.comboConfig?.rightLabel ?? "(%)";

    return (
      <div className="space-y-0">
        <ResponsiveContainer width="100%" height={height + 30}>
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            {xAxis}
            {/* LHS YAxis */}
            <YAxis yAxisId="left" {...axisStyle} width={45} domain={yAxisDomain} tickFormatter={(v) => v.toLocaleString()}>
              <Label value={leftLabel} offset={15} position="top" style={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
            </YAxis>
            {/* RHS YAxis */}
            <YAxis yAxisId="right" orientation="right" {...axisStyle} width={45} tickFormatter={(v) => `${v}%`}>
               <Label value={rightLabel} offset={15} position="top" style={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
            </YAxis>

            <Tooltip content={<CustomTooltip dataset={dataset} columnNames={columnNameMap} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />

            <Legend
              verticalAlign="bottom"
              align="left"
              formatter={(value) => columnNameMap[value] ?? value}
              wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 15 }}
              iconSize={10}
            />

            {finalBarKeys.map((key, i) => (
              <Bar
                key={key}
                yAxisId="left"
                dataKey={key}
                fill={getColor(dataset, i)}
                radius={[1, 1, 0, 0]}
                maxBarSize={40}
                name={columnNameMap[key] ?? key}
              />
            ))}

            {finalLineKeys.map((key, i) => (
              <Line
                key={key}
                yAxisId="right"
                type="monotone"
                dataKey={key}
                stroke={getColor(dataset, finalBarKeys.length + i)}
                strokeWidth={2.5}
                dot={i === 0 ? { r: 3.5, strokeWidth: 1.5, fill: "#fff", stroke: getColor(dataset, finalBarKeys.length + i) } : { r: 3, strokeWidth: 0, fill: getColor(dataset, finalBarKeys.length + i) }}
                activeDot={{ r: 5, strokeWidth: 1, stroke: "#fff" }}
                name={columnNameMap[key] ?? key}
              />
            ))}
            <Brush
              dataKey={xKey}
              height={BRUSH_STYLE.height}
              stroke={BRUSH_STYLE.stroke}
              fill={BRUSH_STYLE.fill}
              travellerWidth={6}
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(range) => setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })}
              tickFormatter={() => ""}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* GDP Composition Breakdown Section */}
        {dataset.donutConfig && dataset.donutConfig.breakdownRows && dataset.donutConfig.breakdownRows.length > 0 && (
          <div className="border-t mt-4 pt-5 px-4" style={{ borderColor: dataset.donutConfig.breakdownBorderColor ?? "#E5E7EB" }}>
            {dataset.donutConfig.breakdownLabelCol && (
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {dataset.donutConfig.breakdownLabelCol}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dataset.donutConfig.breakdownRows.map((row, i) => {
                const label = String(row[dataset.donutConfig!.breakdownLabelCol!] ?? "");
                const value = row[dataset.donutConfig!.breakdownValueCol ?? dataset.columns[1]] ?? 0;
                const color = getColor(dataset, i);
                return (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 border border-[#F3F4F6]">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="min-w-0">
                      <div className="text-[11px] text-gray-500 truncate">{label}</div>
                      <div className="text-[13px] font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}{dataset.donutConfig.showPercentage ? '%' : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (dataset.chartType === "donut") {
    const cfg = dataset.donutConfig;
    const labelCol = cfg?.labelColumn ?? dataset.columns[0];
    const valueCol = cfg?.valueColumn ?? (dataset.columns[1] ?? "");
    const innerPct = cfg?.innerRadiusPercent ?? 60;

    const pieData = dataset.rows
      .map((r) => ({ name: String(r[labelCol] ?? ""), value: Number(r[valueCol]) || 0 }))
      .filter(r => r.name && r.value > 0);

    const total = pieData.reduce((s, r) => s + r.value, 0);

    return (
      <div className="space-y-0">
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <ResponsiveContainer width={160} height={height}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={`${innerPct * 0.55}%`}
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={getColor(dataset, i)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  cfg?.showPercentage ? `${((value / total) * 100).toFixed(1)}%` : value.toLocaleString(),
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend with values */}
          <div className="flex-1 space-y-2">
            {pieData.map((item, i) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(dataset, i) }} />
                  <span className="text-[12px] text-gray-600 flex-1 truncate">{item.name}</span>
                  <span className="text-[12.5px] font-bold text-gray-900">
                    {cfg?.showPercentage ? `${pct}%` : item.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional breakdown section below donut */}
        {cfg && cfg.breakdownRows && cfg.breakdownRows.length > 0 && (
          <div className="border-t border-[#E5E7EB] mt-4 pt-4">
            {cfg.breakdownLabelCol && (
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                {cfg.breakdownLabelCol}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cfg.breakdownRows.map((row, i) => {
                const label = String(row[cfg.breakdownLabelCol!] ?? "");
                const value = row[cfg.breakdownValueCol ?? valueCol] ?? 0;
                return (
                  <div key={i} className="flex items-center gap-2.5 py-2 px-3 border border-[#F3F4F6] hover:border-gray-300">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(dataset, i) }} />
                    <div className="min-w-0">
                      <div className="text-[11px] text-gray-500 truncate">{label}</div>
                      <div className="text-[13px] font-bold text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : value}{cfg.showPercentage ? '%' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height + 30}>
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        {xAxis}
        <YAxis {...axisStyle} width={45} />
        <Tooltip content={<CustomTooltip dataset={dataset} columnNames={columnNameMap} />} />
        <Legend
          verticalAlign="bottom"
          align="left"
          formatter={(value) => columnNameMap[value] ?? value}
          wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 15 }}
          iconType="circle"
          iconSize={8}
        />
        {dataKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={getColor(dataset, i)}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: getColor(dataset, i) }}
            name={columnNameMap[key] ?? key}
            activeDot={{ r: 5, strokeWidth: 1, stroke: "#fff" }}
          />
        ))}
        <Brush
          dataKey={xKey}
          height={BRUSH_STYLE.height}
          stroke={BRUSH_STYLE.stroke}
          fill={BRUSH_STYLE.fill}
          travellerWidth={6}
          startIndex={brushRange.startIndex}
          endIndex={brushRange.endIndex}
          onChange={(range) => setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })}
          tickFormatter={() => ""}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
