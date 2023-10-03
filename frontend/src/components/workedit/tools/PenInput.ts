import { useCanvasSizing } from '@/stores/canvasSizing';

export type PenInput = {
  x: number;
  y: number;
  pressure: number;
};

export const eventToPenInput = (e: PointerEvent) => {
  const cs = useCanvasSizing();
  const p = cs.clientToCanvas(e.clientX, e.clientY);
  return {
    x: p.x,
    y: p.y,
    pressure: e.pressure
  };
};
