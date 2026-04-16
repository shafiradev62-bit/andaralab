import { useState, useRef, useCallback } from "react";

interface ZoomRange {
  startIndex?: number;
  endIndex?: number;
}

/**
 * Cursor-anchored zoom for recharts Brush.
 *
 * Formula (index-space equivalent of the TradingView anchor zoom):
 *   mouseRatio  = (cursorX - plotLeft) / plotWidth   → 0..1
 *   anchorIdx   = start + (end - start) * mouseRatio
 *   newRange    = oldRange * zoomFactor
 *   newStart    = anchorIdx - newRange * mouseRatio
 *   newEnd      = anchorIdx + newRange * (1 - mouseRatio)
 *
 * The container div must be the direct recharts wrapper so we can read
 * its bounding rect to derive plotLeft / plotWidth.
 * Recharts reserves ~45 px left margin and ~30 px right margin by default;
 * we read those from the SVG itself when available, otherwise fall back to
 * sensible defaults.
 */

const MIN_VISIBLE = 4;   // never show fewer than 4 data points
const ZOOM_SENSITIVITY = 0.0012; // per deltaY unit → fraction of range change
const MAX_DELTA = 120;   // clamp raw deltaY to prevent jitter on fast scroll

/** Read the actual plot area bounds from the recharts SVG inside `container`. */
function getPlotBounds(container: HTMLElement): { left: number; width: number } | null {
  // recharts renders a <g class="recharts-cartesian-grid"> or the inner plot
  // as a clipPath rect. The most reliable anchor is the recharts-surface SVG.
  const svg = container.querySelector<SVGSVGElement>("svg.recharts-surface");
  if (!svg) return null;

  const svgRect = svg.getBoundingClientRect();

  // Try to read margin from the first <g class="recharts-layer recharts-cartesian-axis recharts-xAxis">
  // Its first <line> or <text> gives us the left edge of the plot.
  // Fallback: use fixed recharts default margins (left=45, right=30).
  const yAxisEl = svg.querySelector<SVGGElement>(".recharts-yAxis");
  const leftMargin = yAxisEl ? yAxisEl.getBoundingClientRect().width + yAxisEl.getBoundingClientRect().left - svgRect.left : 45;

  const rightAxisEl = svg.querySelector<SVGGElement>(".recharts-yAxis.yAxis.recharts-yAxis[orientation='right']");
  const rightMargin = rightAxisEl ? rightAxisEl.getBoundingClientRect().width : 30;

  const plotLeft = svgRect.left + leftMargin;
  const plotWidth = svgRect.width - leftMargin - rightMargin;

  if (plotWidth <= 0) return null;
  return { left: plotLeft, width: plotWidth };
}

export function useChartZoom(dataLength: number, defaultStartIndex?: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  const [brushRange, setBrushRange] = useState<ZoomRange>(() => ({
    startIndex: defaultStartIndex ?? Math.max(0, dataLength - 24),
    endIndex: dataLength > 0 ? dataLength - 1 : undefined,
  }));

  // Keep a ref copy so wheel handler always reads latest without stale closure
  const brushRef = useRef<ZoomRange>(brushRange);
  brushRef.current = brushRange;

  const applyZoom = useCallback(
    (mouseRatio: number, factor: number) => {
      if (!dataLength) return;

      setBrushRange((prev) => {
        const start = prev.startIndex ?? 0;
        const end = prev.endIndex ?? dataLength - 1;
        const oldRange = end - start;

        // Anchor index — the data point that must stay under the cursor
        const anchorIdx = start + oldRange * mouseRatio;

        const newRange = Math.max(MIN_VISIBLE, oldRange * factor);

        let newStart = Math.round(anchorIdx - newRange * mouseRatio);
        let newEnd = Math.round(anchorIdx + newRange * (1 - mouseRatio));

        // Clamp to data bounds while preserving range size
        if (newStart < 0) {
          newEnd = Math.min(dataLength - 1, newEnd - newStart);
          newStart = 0;
        }
        if (newEnd > dataLength - 1) {
          newStart = Math.max(0, newStart - (newEnd - (dataLength - 1)));
          newEnd = dataLength - 1;
        }

        // Prevent micro-updates that cause jitter
        if (newStart === prev.startIndex && newEnd === prev.endIndex) return prev;

        return { startIndex: newStart, endIndex: newEnd };
      });
    },
    [dataLength]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const raw = e.deltaY;
      if (Math.abs(raw) < 1) return;
      e.preventDefault();
      e.stopPropagation();

      // Cancel any pending RAF to avoid queuing too many updates
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;

        // Clamp delta for smooth feel on high-resolution trackpads
        const delta = Math.sign(raw) * Math.min(Math.abs(raw), MAX_DELTA);

        // zoomFactor > 1 = zoom out, < 1 = zoom in
        const zoomFactor = 1 + delta * ZOOM_SENSITIVITY;

        // Derive mouseRatio from cursor position relative to plot area
        let mouseRatio = 0.5; // fallback: center
        if (containerRef.current) {
          const bounds = getPlotBounds(containerRef.current);
          if (bounds) {
            mouseRatio = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
          }
        }

        applyZoom(mouseRatio, zoomFactor);
      });
    },
    [applyZoom]
  );

  // Pinch-to-zoom: use midpoint of two fingers as anchor
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2) return;

      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx = t0.clientX - t1.clientX;
      const dy = t0.clientY - t1.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current;
        if (Math.abs(delta) > 1) {
          // Midpoint of the two fingers as anchor
          let mouseRatio = 0.5;
          if (containerRef.current) {
            const midX = (t0.clientX + t1.clientX) / 2;
            const bounds = getPlotBounds(containerRef.current);
            if (bounds) {
              mouseRatio = Math.max(0, Math.min(1, (midX - bounds.left) / bounds.width));
            }
          }
          // delta > 0 = fingers spreading = zoom in → factor < 1
          const factor = 1 - (delta / 200);
          applyZoom(mouseRatio, factor);
        }
      }
      lastPinchDist.current = dist;
    },
    [applyZoom]
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
  }, []);

  /** Attach this ref to the div wrapping the ResponsiveContainer */
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
  }, []);

  const zoomProps = {
    ref: setContainerRef,
    onWheel: handleWheel,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: { touchAction: "none" } as React.CSSProperties,
  };

  return { brushRange, setBrushRange, zoomProps };
}
