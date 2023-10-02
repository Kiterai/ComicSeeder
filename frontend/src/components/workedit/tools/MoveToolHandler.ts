import { type ToolHandler } from './ToolHandler';
import { CanvasTouchGestureManager } from '../CanvasTouchGestureManager';

export class MoveToolHandler implements ToolHandler {
  touchManager: CanvasTouchGestureManager;
  constructor(touchManager: CanvasTouchGestureManager) {
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
