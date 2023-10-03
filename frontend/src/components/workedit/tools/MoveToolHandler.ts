import { type ToolHandler } from './ToolHandler';
import { useCanvasTouchGesture } from '@/composables/useCanvasTouchGesture';

export class MoveToolHandler implements ToolHandler {
  touchManager: ReturnType<typeof useCanvasTouchGesture>;
  constructor(touchManager: ReturnType<typeof useCanvasTouchGesture>) {
    this.touchManager = touchManager;
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
