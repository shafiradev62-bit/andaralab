import { useState, useRef, useCallback, useEffect } from "react";

interface ZoomRange {
  startIndex?: number;
  endIndex?: number;
}

const MIN_VISIBLE = 4;
const ZOOM_SENSITIVITY = 0.0012;
const MAX_DELTA = 120;

/**
 * Read the actual plot area left edge + width from the recharts SVG.
 * Falls back to sensible defaults if DOM isn't ready yet.
 */
function getPlotBounds(container: HTMLElement): { left: number; width: number } | null {
  const svg = container.querySelector<SVGSVGElement>("svg.recharts-surface");
  if (!svg) return null;

  const svgRect = svg.getBoundingClientRect();

  const yAxisEl = svg.querySelector<SVGGElement>(".recharts-yAxis");
  const leftMargin = yAxisEl
    ? yAxisEl.getBoundingClientRect().width + yAxisEl.getBoundingClientRect().left - svgRect.left
    : 45;

  const rightAxisEl = svg.querySelector<SVGGElement>(".recharts-yAxis[orientation='right']");
  const rightMargin = rightAxisEl ? rightAxisEl.getBoundingClientRect().width : 30;

  const plotLeft = svgRect.left + leftMargin;
  const plotWidth = svgRect.width - leftMargin - rightMargin;

  if (plotWidth <= 0) return null;
  return { left: plotLeft, width: plotWidth };
}

/**
 * Cursor-anchored zoom for recharts Brush.
 *
 * Anchor formula (TradingView / Figma style):
 *   mouseRatio = (cursorX - plotLeft) / plotWidth        → 0..1
 *   anchorIdx  = start + oldRange * mouseRatio
 *   newRange   = oldRange * zoomFactor
 *   newStart   = anchorIdx - newRange * mouseRatio
 *   newEnd     = anchorIdx + newRange * (1 - mouseRatio)
 *
 * Uses a native wheel listener with { passive: false } so preventDefault()
 * actually works — no Ctrl required.
 */
export function useChartZoom(dataLength: number, defaultStartIndex?: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  const [brushRange, setBrushRange] = useState<ZoomRange>(() => ({
    startIndex: defaultStartIndex ?? Math.max(0, dataLength - 24),
    endIndex: dataLength > 0 ? dataLength - 1 : undefined,
  }));

  const applyZoom = useCallback(
    (mouseRatio: number, factor: number) => {
      if (!dataLength) return;
      setBrushRange((prev) => {
        const start = prev.startIndex ?? 0;
        const end = prev.endIndex ?? dataLength - 1;
        const oldRange = end - start;

        const anchorIdx = start + oldRange * mouseRatio;
        const newRange = Math.max(MIN_VISIBLE, oldRange * factor);

        let newStart = Math.round(anchorIdx - newRange * mouseRatio);
        let newEnd = Math.round(anchorIdx + newRange * (1 - mouseRatio));

        // Clamp to bounds while preserving range size
        if (newStart < 0) {
          newEnd = Math.min(dataLength - 1, newEnd - newStart);
          newStart = 0;
        }
        if (newEnd > dataLength - 1) {
          newStart = Math.max(0, newStart - (newEnd - (dataLength - 1)));
          newEnd = dataLength - 1;
        }

        if (newStart === prev.startIndex && newEnd === prev.endIndex) return prev;
        return { startIndex: newStart, endIndex: newEnd };
      });
    },
    [dataLength]
  );

  // Stable ref to applyZoom so the native listener closure never goes stale
  const applyZoomRef = useRef(applyZoom);
  applyZoomRef.current = applyZoom;

  // Native wheel listener — { passive: false } lets us call preventDefault()
  // unconditionally, so the browser never intercepts scroll for page zoom.
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      e.stopPropagation();

      if (rafId.current !== null) cancelAnimationFrame(rafId.current);

      // Capture clientX before RAF (event object may be recycled)
      const clientX = e.clientX;
      const rawDelta = e.deltaY;

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const delta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), MAX_DELTA);
        const zoomFactor = 1 + delta * ZOOM_SENSITIVITY;

        let mouseRatio = 0.5;
        const bounds = getPlotBounds(el);
        if (bounds) {
          mouseRatio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
        }
        applyZoomRef.current(mouseRatio, zoomFactor);
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  // Only re-attach when the DOM element changes (ref callback fires)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pinch-to-zoom
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2) return;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.sqrt((t0.clientX - t1.clientX) ** 2 + (t0.clientY - t1.clientY) ** 2);

      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current;
        if (Math.abs(delta) > 1) {
          let mouseRatio = 0.5;
          if (containerRef.current) {
            const midX = (t0.clientX + t1.clientX) / 2;
            const bounds = getPlotBounds(containerRef.current);
            if (bounds) mouseRatio = Math.max(0, Math.min(1, (midX - bounds.left) / bounds.width));
          }
          applyZoom(mouseRatio, 1 - delta / 200);
        }
      }
      lastPinchDist.current = dist;
    },
    [applyZoom]
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
  }, []);

  const zoomProps = {
    ref: setContainerRef,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: { touchAction: "none" } as React.CSSProperties,
  };

  return { brushRange, setBrushRange, zoomProps };
}
