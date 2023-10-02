import type { useCanvasSizing } from '@/composables/useCanvasSizing';

export type PenInput = {
  x: number;
  y: number;
  pressure: number;
};

export const eventToPenInput = (e: PointerEvent, cs: ReturnType<typeof useCanvasSizing>) => {
  const p = cs.clientToCanvas(e.clientX, e.clientY);
  return {
    x: p.x,
    y: p.y,
    pressure: e.pressure
  };
};
