import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
  Label, PieChart, Pie, Cell, Brush
} from "recharts";
import { ChartDataset } from "@/lib/cms-store";
import { formatValue, formatIdNumber } from "@/lib/utils";
import { fillMissingYearsOnRows } from "@/lib/chart-x-axis";
import { useLocale } from "@/lib/locale";
import { useState, useEffect, useMemo } from "react";
import { useChartZoom } from "@/hooks/useChartZoom";
import { BarChart2 as BarChartIcon, LineChart as LineChartIcon } from "lucide-react";

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

function getColor(dataset: ChartDataset, i: number): string {
  if (dataset.colors && dataset.colors[i]) return dataset.colors[i];
  return DEFAULT_COLORS[i % DEFAULT_COLORS.length];
}

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

function parseXLabel(val: string) {
  const str = String(val).trim();
  // Strip trailing forecast/provisional markers for display
  const clean = str.replace(/[\*\+]+$/, "").trim();
  const match = clean.match(/\b(19|20)\d{2}\b/);
  const year = match ? match[0] : null;

  let period = clean;
  if (year) {
    if (clean === year) {
      period = year;
    } else {
      period = clean.replace(year, "").trim().replace(/^[-/]|[-/]$/g, "").trim();
    }
  }

  return { year, period: period || year || clean };
}

function CustomTooltip({ active, payload, label, dataset, columnNames }: any) {
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
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-[11.5px] text-gray-500">{displayName}</span>
            </div>
            <span className="text-[12px] font-semibold text-gray-900">
              {typeof p.value === "number" ? formatValue(p.value, unitType, unit) : p.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const { year, period } = parseXLabel(payload.value);
  const yearOnly = period === year;

  // Format: "Q1 (2014)" for sub-period data, plain year for annual data
  const label = (!yearOnly && year) ? `${period} (${year})` : (year ?? period);

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#6B7280" fontSize={10} fontWeight="500">
        {label}
      </text>
    </g>
  );
};

const BRUSH_STYLE = {
  stroke: "#CBD5E1",
  fill: "#F8FAFC",
  height: 48,
};

export default function InteractiveChart({ dataset, height = 280 }: Props) {
  const { locale } = useLocale();
  const [activeTimeframe, setActiveTimeframe] = useState<string | null>(null);

  const dataKeys = dataset.columns.slice(1);
  const xKey = dataset.columns[0];

  const data = useMemo(() => {
    const rows = dataset.rows.map((r) => {
      const obj: Record<string, any> = {};
      for (const c of dataset.columns) obj[c] = r[c];
      return obj;
    });
    // Preserve CMS/table row order (top → bottom); only fill implicit years on the X column.
    return fillMissingYearsOnRows(rows, xKey);
  }, [dataset.rows, dataset.columns, xKey]);

  const { brushRange, setBrushRange, zoomProps } = useChartZoom(
    data.length,
    Math.max(0, data.length - 24)
  );

  useEffect(() => {
    setActiveTimeframe(null);
  }, [data.length]);

  const handleTimeframeChange = (years: number | null, label: string) => {
    setActiveTimeframe(label);
    if (!data.length) return;

    if (years === null) {
      setBrushRange({ startIndex: 0, endIndex: data.length - 1 });
      return;
    }

    const lastRow = data[data.length - 1];
    const lastDateInfo = parseXLabel(String(lastRow[xKey]));
    
    if (lastDateInfo.year) {
      const targetYear = Number(lastDateInfo.year) - years;
      const startIndex = data.findIndex(d => {
        const y = parseXLabel(String(d[xKey])).year;
        return y !== null && Number(y) >= targetYear;
      });

      if (startIndex !== -1) {
        setBrushRange({ startIndex, endIndex: data.length - 1 });
        return;
      }
    }

    const approxPoints = years * 12;
    setBrushRange({
      startIndex: Math.max(0, data.length - approxPoints),
      endIndex: data.length - 1
    });
  };

  const timeframes = [
    { label: locale === 'en' ? '1Y' : '1T', years: 1 },
    { label: locale === 'en' ? '3Y' : '3T', years: 3 },
    { label: locale === 'en' ? '5Y' : '5T', years: 5 },
    { label: locale === 'en' ? '10Y' : '10T', years: 10 },
    { label: locale === 'en' ? 'Max' : 'Max', years: null },
  ];

  const columnNameMap: Record<string, string> = {};
  for (const col of dataset.columns) {
    columnNameMap[col] = getColumnLabel(dataset, col);
  }

  const yAxisUnitLabel = (() => {
    const u = (dataset.unit ?? "").trim();
    if (u) return u;
    const yl = locale === "id" ? dataset.yAxisLabelId : dataset.yAxisLabel;
    return (yl ?? "").trim();
  })();

  const commonProps = {
    data,
    margin: { top: 25, right: 30, left: yAxisUnitLabel ? 16 : 0, bottom: 25 },
  };

  const axisStyle = {
    tick: { fontSize: 10, fill: "#9CA3AF" },
    axisLine: { stroke: "#E5E7EB" },
    tickLine: false,
  };

  // Y-axis: thousands with `.`, decimals with `.` (matches tooltips / Mba Dinda)
  const yTickFormatter = (v: number) => {
    if (!Number.isFinite(v)) return String(v);
    if (dataset.unitType === "percent") {
      return formatIdNumber(v, 2);
    }
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return formatIdNumber(v / 1_000_000, 1) + "M";
    if (abs >= 1_000) return formatIdNumber(Math.round(v), 0);
    return formatIdNumber(v, 2);
  };

  // Compute explicit domain to prevent recharts from inverting the Y-axis
  const allValues = dataKeys.flatMap((key) =>
    data.map((r) => {
      const v = r[key];
      return typeof v === "number" ? v : parseFloat(String(v));
    }).filter((v) => !isNaN(v))
  );
  const computedMin = allValues.length ? Math.min(...allValues) : 0;
  const computedMax = allValues.length ? Math.max(...allValues) : 1;
  // Add padding: 5% below min, 5% above max — never invert axis
  const paddedMin = computedMin >= 0
    ? Math.floor(computedMin * 0.95)
    : Math.floor(computedMin * 1.05);
  const paddedMax = computedMax >= 0
    ? Math.ceil(computedMax * 1.05)
    : Math.ceil(computedMax * 0.95);

  // Manual min/max may extend the axis but must never clip the data (bad max caused wrong ticks)
  const yMin =
    dataset.yAxisMin !== undefined && Number.isFinite(dataset.yAxisMin)
      ? Math.min(paddedMin, dataset.yAxisMin)
      : paddedMin;
  const yMax =
    dataset.yAxisMax !== undefined && Number.isFinite(dataset.yAxisMax)
      ? Math.max(paddedMax, dataset.yAxisMax)
      : paddedMax;
  const yAxisDomain: [number | string, number | string] = [yMin, yMax];

  const yAxisLabelEl = yAxisUnitLabel ? (
    <Label
      value={yAxisUnitLabel}
      angle={-90}
      position="insideLeft"
      style={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }}
    />
  ) : null;

  const hasYearGroup = data.length > 0 && parseXLabel(String(data[0][xKey])).year !== null;
  const xAxisHeight = 30;

  const renderXAxis = () => (
    <XAxis
      dataKey={xKey}
      {...axisStyle}
      interval={0}
      height={xAxisHeight}
      tick={<CustomXAxisTick rows={data} />}
    />
  );

  const renderDefaultXAxis = () => (
    <XAxis dataKey={xKey} {...axisStyle} />
  );

  const xAxis = hasYearGroup ? renderXAxis() : renderDefaultXAxis();

  const renderTimeframeSelector = () => (
    <div className="flex justify-end gap-1 mb-2 px-2">
      <span className="text-[11px] text-gray-500 my-auto mr-2">Zoom:</span>
      {timeframes.map(tf => (
        <button
          key={tf.label}
          onClick={() => handleTimeframeChange(tf.years, tf.label)}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
            activeTimeframe === tf.label 
              ? "bg-[#1a3a5c] text-white" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-200 text-gray-400">
        <LineChartIcon className="w-8 h-8 mb-2 opacity-20" />
        <span className="text-[13px]">No data points to display</span>
      </div>
    );
  }

  const renderBrush = () => (
    <Brush
      dataKey={xKey}
      height={BRUSH_STYLE.height}
      stroke={BRUSH_STYLE.stroke}
      fill={BRUSH_STYLE.fill}
      travellerWidth={10}
      startIndex={brushRange.startIndex}
      endIndex={brushRange.endIndex}
      onChange={(range) => setBrushRange({ startIndex: range.startIndex ?? 0, endIndex: range.endIndex ?? 0 })}
      tickFormatter={() => ""}
    >
      {dataset.chartType !== 'combo' ? (
        <LineChart data={data}>
          <Line type="monotone" dataKey={dataKeys[0]} stroke="#9CA3AF" strokeWidth={1} dot={false} isAnimationActive={false} />
        </LineChart>
      ) : null}
    </Brush>
  );

  if (dataset.chartType === "bar") {
    return (
      <div className="w-full flex flex-col min-h-0" {...zoomProps}>
        {renderTimeframeSelector()}
        <ResponsiveContainer width="100%" height={height + 30}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            {xAxis}
            <YAxis {...axisStyle} width={70} domain={yAxisDomain} tickFormatter={yTickFormatter}>
              {yAxisLabelEl}
            </YAxis>
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
              <Bar key={key} dataKey={key} fill={getColor(dataset, i)} radius={[2, 2, 0, 0]} maxBarSize={40} name={columnNameMap[key] ?? key} isAnimationActive={false} />
            ))}
            {renderBrush()}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (dataset.chartType === "area") {
    return (
      <div className="w-full flex flex-col min-h-0" {...zoomProps}>
        {renderTimeframeSelector()}
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
            <YAxis {...axisStyle} width={70} domain={yAxisDomain} tickFormatter={yTickFormatter}>
              {yAxisLabelEl}
            </YAxis>
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
                isAnimationActive={false}
              />
            ))}
            {renderBrush()}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (dataset.chartType === "combo") {
    let finalBarKeys: string[];
    let finalLineKeys: string[];
    if (dataset.comboConfig && dataset.comboConfig.barColumns.length > 0) {
      finalBarKeys = dataset.comboConfig.barColumns.filter(k => dataKeys.includes(k));
      finalLineKeys = dataset.comboConfig.lineColumns.filter(k => dataKeys.includes(k));
    } else {
      const isRHS = (key: string) => key.toLowerCase().includes("%") || key.toLowerCase().includes("perubahan");
      const detectedBars = dataKeys.filter(k => !isRHS(k));
      const detectedLines = dataKeys.filter(k => isRHS(k));
      finalBarKeys = detectedLines.length > 0 ? detectedBars : dataKeys.slice(0, -1);
      finalLineKeys = detectedLines.length > 0 ? detectedLines : dataKeys.slice(-1);
    }
    const leftLabel = dataset.comboConfig?.leftLabel ?? "(Indeks)";
    const rightLabel = dataset.comboConfig?.rightLabel ?? "(%)";
    const comboLeftTitle = [leftLabel, yAxisUnitLabel].filter(Boolean).join(" · ");

    return (
      <div className="space-y-0 w-full flex flex-col min-h-0" {...zoomProps}>
        {renderTimeframeSelector()}
        <ResponsiveContainer width="100%" height={height + 30}>
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            {xAxis}
            <YAxis yAxisId="left" {...axisStyle} width={70} domain={yAxisDomain} tickFormatter={yTickFormatter}>
              <Label value={comboLeftTitle} offset={15} position="top" style={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
            </YAxis>
            <YAxis yAxisId="right" orientation="right" {...axisStyle} width={45} tickFormatter={(v) => `${formatIdNumber(v, 2)}%`}>
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
              <Bar key={key} yAxisId="left" dataKey={key} fill={getColor(dataset, i)} radius={[1, 1, 0, 0]} maxBarSize={40} name={columnNameMap[key] ?? key} isAnimationActive={false} />
            ))}
            {finalLineKeys.map((key, i) => (
              <Line key={key} yAxisId="right" type="monotone" dataKey={key} stroke={getColor(dataset, finalBarKeys.length + i)} strokeWidth={2.5} dot={i === 0 ? { r: 3.5, strokeWidth: 1.5, fill: "#fff", stroke: getColor(dataset, finalBarKeys.length + i) } : { r: 3, strokeWidth: 0, fill: getColor(dataset, finalBarKeys.length + i) }} activeDot={{ r: 5, strokeWidth: 1, stroke: "#fff" }} name={columnNameMap[key] ?? key} isAnimationActive={false} />
            ))}
            {renderBrush()}
          </ComposedChart>
        </ResponsiveContainer>
        {dataset.donutConfig?.breakdownRows && dataset.donutConfig.breakdownRows.length > 0 && (
          <div className="border-t mt-4 pt-5 px-4" style={{ borderColor: dataset.donutConfig.breakdownBorderColor ?? "#E5E7EB" }}>
            {dataset.donutConfig.breakdownLabelCol && <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">{dataset.donutConfig.breakdownLabelCol}</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dataset.donutConfig.breakdownRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 border border-[#F3F4F6]">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(dataset, i) }} />
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-500 truncate">{String(row[dataset.donutConfig!.breakdownLabelCol!] ?? "")}</div>
                    <div className="text-[13px] font-bold text-gray-900">{typeof row[dataset.donutConfig!.breakdownValueCol ?? dataset.columns[1]] === 'number' ? (row[dataset.donutConfig!.breakdownValueCol ?? dataset.columns[1]] as number).toLocaleString() : row[dataset.donutConfig!.breakdownValueCol ?? dataset.columns[1]]}{dataset.donutConfig!.showPercentage ? '%' : ''}</div>
                  </div>
                </div>
              ))}
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
    const pieData = dataset.rows.map((r) => ({ name: String(r[labelCol] ?? ""), value: Number(r[valueCol]) || 0 })).filter(r => r.name && r.value > 0);
    const total = pieData.reduce((s, r) => s + r.value, 0);

    return (
      <div className="space-y-0 min-h-0">
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={160} height={height}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={`${innerPct * 0.55}%`} outerRadius="80%" paddingAngle={2} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={getColor(dataset, i)} />)}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [cfg?.showPercentage ? `${((value / total) * 100).toFixed(1)}%` : value.toLocaleString(), name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(dataset, i) }} />
                <span className="text-[12px] text-gray-600 flex-1 truncate">{item.name}</span>
                <span className="text-[12.5px] font-bold text-gray-900">{cfg?.showPercentage ? `${total > 0 ? ((item.value / total) * 100).toFixed(1) : "0"}%` : item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        {cfg?.breakdownRows && cfg.breakdownRows.length > 0 && (
          <div className="border-t border-[#E5E7EB] mt-4 pt-4">
            {cfg.breakdownLabelCol && <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">{cfg.breakdownLabelCol}</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cfg.breakdownRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 px-3 border border-[#F3F4F6] hover:border-gray-300">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(dataset, i) }} />
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-500 truncate">{String(row[cfg!.breakdownLabelCol!] ?? "")}</div>
                    <div className="text-[13px] font-bold text-gray-900">{typeof row[cfg!.breakdownValueCol ?? valueCol] === 'number' ? (row[cfg!.breakdownValueCol ?? valueCol] as number).toLocaleString() : row[cfg!.breakdownValueCol ?? valueCol]}{cfg!.showPercentage ? '%' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-0" {...zoomProps}>
      {renderTimeframeSelector()}
      <ResponsiveContainer width="100%" height={height + 30}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          {xAxis}
          <YAxis {...axisStyle} width={70} domain={yAxisDomain} tickFormatter={yTickFormatter}>
            {yAxisLabelEl}
          </YAxis>
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
            <Line key={key} type="monotone" dataKey={key} stroke={getColor(dataset, i)} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: getColor(dataset, i) }} name={columnNameMap[key] ?? key} activeDot={{ r: 5, strokeWidth: 1, stroke: "#fff" }} isAnimationActive={false} />
          ))}
          {renderBrush()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
