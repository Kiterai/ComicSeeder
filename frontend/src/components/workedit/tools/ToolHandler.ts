export interface ToolHandler {
  down: (e: PointerEvent) => void;
  move: (e: PointerEvent) => void;
  up: (e: PointerEvent) => void;
  cancel: () => void;
  init?: () => void;
  deinit?: () => void;
}
