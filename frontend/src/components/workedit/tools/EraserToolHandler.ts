import { useOpeHistory } from '@/stores/opeHistory';
import type { ToolHandler } from './ToolHandler';
import { eventToPenInput, type PenInput } from './PenInput';
import { useCanvas } from '@/stores/canvas';
import type { useCanvasSizing } from '@/composables/useCanvasSizing';
import { useDrawState } from '@/stores/drawState';

export class EraserToolHandler implements ToolHandler {
  imgAtBegin: null | ImageData;
  penHistory: PenInput[];
  lastPenInput: null | PenInput;
  opeHistory: ReturnType<typeof useOpeHistory>;
  canvas: ReturnType<typeof useCanvas>;
  canvasSizing: ReturnType<typeof useCanvasSizing>;
  drawStateStore: ReturnType<typeof useDrawState>;

  constructor(canvasSizing: ReturnType<typeof useCanvasSizing>) {
    this.imgAtBegin = null;
    this.penHistory = [];
    this.lastPenInput = null;
    this.opeHistory = useOpeHistory();
    this.canvas = useCanvas();
    this.canvasSizing = canvasSizing;
    this.drawStateStore = useDrawState();
  }
  down(e: PointerEvent) {
    this.opeHistory.beginOperation();
    this.penHistory = [];
    this.lastPenInput = eventToPenInput(e, this.canvasSizing);
    this.penHistory.push(this.lastPenInput);

    this.imgAtBegin = this.canvas.getImage();
    const ctx = this.canvas.ctx!;
    ctx.lineCap = 'round';
    ctx.lineWidth = this.drawStateStore.eraserWidth;
    ctx.globalCompositeOperation = 'destination-out';
  }
  move(e: PointerEvent) {
    const newPenInput = eventToPenInput(e, this.canvasSizing);
    const ctx = this.canvas.ctx!;
    ctx.beginPath();
    ctx.moveTo(this.lastPenInput!.x, this.lastPenInput!.y);
    ctx.lineTo(newPenInput!.x, newPenInput!.y);
    ctx.stroke();
    this.lastPenInput = newPenInput;
    this.penHistory.push(this.lastPenInput);
  }
  up(e: PointerEvent) {
    const undoImg = this.imgAtBegin!;
    const nowPenHistory = this.penHistory;
    const ctx = this.canvas.ctx!;
    this.opeHistory.commitOperation({
      redo: () => {
        let tmpLastPenInput: PenInput | null = null;
        ctx.lineCap = 'round';
        ctx.lineWidth = this.drawStateStore.eraserWidth;
        ctx.globalCompositeOperation = 'destination-out';
        for (const penInput of nowPenHistory) {
          ctx.beginPath();
          ctx.moveTo(tmpLastPenInput!.x, tmpLastPenInput!.y);
          ctx.lineTo(penInput!.x, penInput!.y);
          ctx.stroke();
          tmpLastPenInput = penInput;
        }
      },
      undo: () => {
        ctx.putImageData(undoImg, 0, 0);
      }
    });
  }
}
