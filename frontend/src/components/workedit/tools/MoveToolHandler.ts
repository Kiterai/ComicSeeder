import { useCanvasSizing } from '@/stores/canvasSizing';
import { type ToolHandler } from './ToolHandler';
import { useCanvasTouchGesture } from '@/composables/useCanvasTouchGesture';

export class MoveToolHandler implements ToolHandler {
  touchManager: ReturnType<typeof useCanvasTouchGesture>;
  constructor() {
    this.touchManager = useCanvasSizing().touchManager;
  }
  down(e: PointerEvent) {
    this.touchManager.onfingerdown(e);
  }
  move(e: PointerEvent) {
    this.touchManager.onfingermove(e);
  }
  up(e: PointerEvent) {
    this.touchManager.onfingerup(e);
  }
}
