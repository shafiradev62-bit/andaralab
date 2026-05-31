import { useState, useRef, useCallback, useEffect } from "react";

interface ZoomRange {
  startIndex: number;
  endIndex: number;
}

const MIN_VISIBLE = 4;
const WHEEL_SENSITIVITY = 0.0015; // Slightly increased for better responsiveness
const MAX_DELTA_CAP = 150;

function getPlotBounds(container: HTMLElement): { left: number; width: number } | null {
  const svg = container.querySelector<SVGSVGElement>("svg.recharts-surface");
  if (!svg) return null;
  const svgRect = svg.getBoundingClientRect();
  if (svgRect.width === 0) return null;

  // Most accurate: recharts clip rect = exact plot area
  const clipRect = svg.querySelector<SVGRectElement>("defs clipPath rect");
  if (clipRect) {
    const x = parseFloat(clipRect.getAttribute("x") ?? "0");
    const w = parseFloat(clipRect.getAttribute("width") ?? "0");
    if (w > 0) return { left: svgRect.left + x, width: w };
  }

  // Fallback: derive from Y-axis elements
  const leftAxis  = svg.querySelector<SVGGElement>(".recharts-yAxis:not([orientation='right'])");
  const rightAxis = svg.querySelector<SVGGElement>(".recharts-yAxis[orientation='right']");
  const plotLeft  = leftAxis  ? leftAxis.getBoundingClientRect().right  : svgRect.left + 45;
  const plotRight = rightAxis ? rightAxis.getBoundingClientRect().left  : svgRect.right - 10;
  const w = plotRight - plotLeft;
  return w > 0 ? { left: plotLeft, width: w } : null;
}

export function useChartZoom(dataLength: number, defaultStartIndex?: number) {
  const rangeRef = useRef<ZoomRange>({
    startIndex: defaultStartIndex ?? Math.max(0, dataLength - 24),
    endIndex:   Math.max(0, dataLength - 1),
  });
  
  const [brushRange, setBrushRangeState] = useState<ZoomRange>(() => ({ ...rangeRef.current }));
  const cleanupRef      = useRef<(() => void) | null>(null);
  const lastPinchDist   = useRef<number | null>(null);
  const rafId           = useRef<number | null>(null);

  // Synchronize state when dataLength changes (crucial for transitions between datasets)
  useEffect(() => {
    if (dataLength === 0) {
      const empty = { startIndex: 0, endIndex: 0 };
      rangeRef.current = empty;
      setBrushRangeState(empty);
      return;
    }

    // If current range is invalid or just initialized at 0, reset to default
    const isStale = rangeRef.current.endIndex >= dataLength || 
                    (rangeRef.current.startIndex === 0 && rangeRef.current.endIndex === 0 && dataLength > 1);

    if (isStale) {
      const updated = {
        startIndex: defaultStartIndex ?? Math.max(0, dataLength - 24),
        endIndex: Math.max(0, dataLength - 1)
      };
      rangeRef.current = updated;
      setBrushRangeState(updated);
    }
  }, [dataLength, defaultStartIndex]);

  const setBrushRange = useCallback((r: ZoomRange) => {
    // Clamp values just in case
    const startIndex = Math.max(0, Math.min(r.startIndex, dataLength - 1));
    const endIndex = Math.max(startIndex, Math.min(r.endIndex, dataLength - 1));
    const normalized = { startIndex, endIndex };
    
    rangeRef.current = normalized;
    setBrushRangeState(normalized);
  }, [dataLength]);

  const applyZoomRef = useRef<(ratio: number, factor: number) => void>(() => {});

  applyZoomRef.current = (mouseRatio: number, factor: number) => {
    if (dataLength <= MIN_VISIBLE) return;
    
    const { startIndex: start, endIndex: end } = rangeRef.current;
    const oldRange = end - start;
    
    // Calculate new range size
    let newRange = oldRange * factor;
    
    // If delta was very small, ensure at least 1 unit change if possible
    if (factor !== 1 && Math.abs(newRange - oldRange) < 0.5) {
      newRange = oldRange + (factor > 1 ? 1 : -1);
    }
    
    newRange = Math.min(Math.max(MIN_VISIBLE, Math.round(newRange)), dataLength - 1);
    
    if (newRange === oldRange && oldRange > MIN_VISIBLE && oldRange < dataLength - 1) {
       // Force change if we are not at boundaries
       newRange = factor > 1 ? oldRange + 1 : oldRange - 1;
    }

    if (newRange === oldRange) return;

    const anchor = start + oldRange * mouseRatio;
    let ns = anchor - newRange * mouseRatio;
    let ne = anchor + newRange * (1 - mouseRatio);

    if (ns < 0)              { ne = Math.min(dataLength - 1, ne - ns); ns = 0; }
    if (ne > dataLength - 1) { ns = Math.max(0, ns - (ne - (dataLength - 1))); ne = dataLength - 1; }

    const s = Math.round(ns), e = Math.round(ne);
    if (s === start && e === end) return;
    setBrushRange({ startIndex: s, endIndex: e });
  };

  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Ignore if mostly horizontal or very tiny movement
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || Math.abs(e.deltaY) < 0.1) return;
      
      e.preventDefault();
      e.stopPropagation();

      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      
      const clientX  = e.clientX;
      const rawDelta = e.deltaY;

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const delta  = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), MAX_DELTA_CAP);
        const factor = 1 + delta * WHEEL_SENSITIVITY;

        let ratio = 0.5;
        const bounds = getPlotBounds(el);
        if (bounds) ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));

        applyZoomRef.current(ratio, factor);
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    cleanupRef.current = () => {
      el.removeEventListener("wheel", onWheel);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []); // stable

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2) return;
    
    const t0 = e.touches[0], t1 = e.touches[1];
    const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
    
    if (lastPinchDist.current !== null) {
      const delta = dist - lastPinchDist.current;
      if (Math.abs(delta) > 1) { // Increased threshold slightly
        const midX = (t0.clientX + t1.clientX) / 2;
        let ratio = 0.5;
        const el = (e.currentTarget as HTMLDivElement);
        const bounds = getPlotBounds(el);
        if (bounds) ratio = Math.max(0, Math.min(1, (midX - bounds.left) / bounds.width));
        
        // Use a more predictable pinch factor
        const factor = 1 - delta / 200;
        applyZoomRef.current(ratio, factor);
        lastPinchDist.current = dist; // Update only after significant move
      }
    } else {
      lastPinchDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => { 
    lastPinchDist.current = null; 
  }, []);

  const zoomProps = {
    ref: setContainerRef,
    onTouchMove: handleTouchMove,
    onTouchEnd:  handleTouchEnd,
    style: { touchAction: "none" } as React.CSSProperties,
  };

  return { brushRange, setBrushRange, zoomProps };
}
