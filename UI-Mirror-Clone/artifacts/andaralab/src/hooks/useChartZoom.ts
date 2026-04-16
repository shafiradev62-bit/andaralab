import { useState, useRef, useCallback } from "react";

interface ZoomRange {
  startIndex?: number;
  endIndex?: number;
}

/**
 * Hook for mouse-wheel + pinch-to-zoom on recharts Brush.
 * Returns: { brushRange, setBrushRange, zoomProps }
 * Spread `zoomProps` on the container div wrapping the chart.
 */
export function useChartZoom(dataLength: number, defaultStartIndex?: number) {
  const [brushRange, setBrushRange] = useState<ZoomRange>(() => ({
    startIndex: defaultStartIndex ?? Math.max(0, dataLength - 24),
    endIndex: dataLength > 0 ? dataLength - 1 : undefined,
  }));

  // Track last pinch distance
  const lastPinchDist = useRef<number | null>(null);

  const zoom = useCallback(
    (direction: "in" | "out", intensity = 1) => {
      if (!dataLength) return;
      const step = Math.max(1, Math.floor(dataLength * 0.08 * intensity));

      setBrushRange((prev) => {
        const start = prev.startIndex ?? 0;
        const end = prev.endIndex ?? dataLength - 1;

        if (direction === "in") {
          if (end - start <= 4) return prev;
          return {
            startIndex: Math.min(end - 4, start + step),
            endIndex: Math.max(start + 4, end - step),
          };
        } else {
          return {
            startIndex: Math.max(0, start - step),
            endIndex: Math.min(dataLength - 1, end + step),
          };
        }
      });
    },
    [dataLength]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      zoom(e.deltaY < 0 ? "in" : "out");
    },
    [zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current;
        if (Math.abs(delta) > 2) {
          zoom(delta > 0 ? "in" : "out", Math.min(3, Math.abs(delta) / 20));
        }
      }
      lastPinchDist.current = dist;
    },
    [zoom]
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
  }, []);

  const zoomProps = {
    onWheel: handleWheel,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: { touchAction: "none" } as React.CSSProperties,
  };

  return { brushRange, setBrushRange, zoomProps };
}
