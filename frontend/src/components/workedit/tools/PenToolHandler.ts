import { useOpeHistory } from '@/stores/opeHistory';
import { eventToPenInput, type PenInput } from './PenInput';
import type { ToolHandler } from './ToolHandler';
import { useCanvas } from '@/stores/canvas';
import { useDrawState } from '@/stores/drawState';
import { useWorkPages } from '@/stores/workPages';
import { useCanvasSizing } from '@/stores/canvasSizing';

export class PenToolHandler implements ToolHandler {
  imgAtBegin: null | ImageData;
  penHistory: PenInput[];
  lastPenInput: null | PenInput;
  opeHistory: ReturnType<typeof useOpeHistory>;
  canvas: ReturnType<typeof useCanvas>;
  drawStateStore: ReturnType<typeof useDrawState>;
  workPagesStore: ReturnType<typeof useWorkPages>;
  canvasSizing: ReturnType<typeof useCanvasSizing>;

  constructor() {
    this.imgAtBegin = null;
    this.penHistory = [];
    this.lastPenInput = null;
    this.opeHistory = useOpeHistory();
    this.canvas = useCanvas();
    this.drawStateStore = useDrawState();
    this.workPagesStore = useWorkPages();
    this.canvasSizing = useCanvasSizing();
  }
  down(e: PointerEvent) {
    this.opeHistory.beginOperation();
    this.penHistory = [];
    this.lastPenInput = eventToPenInput(e);
    this.penHistory.push(this.lastPenInput);

    this.imgAtBegin = this.canvas.getImage();
    const tmpctx = this.canvas.tmpctx!;
    tmpctx.strokeStyle = this.drawStateStore.penColor;
    tmpctx.lineCap = 'round';
    tmpctx.lineWidth = this.drawStateStore.penWidth;
    tmpctx.globalCompositeOperation = 'source-over';
  }
  move(e: PointerEvent) {
    const newPenInput = eventToPenInput(e);
    const tmpctx = this.canvas.tmpctx!;
    tmpctx.beginPath();
    tmpctx.moveTo(this.lastPenInput!.x, this.lastPenInput!.y);
    tmpctx.lineTo(newPenInput!.x, newPenInput!.y);
    tmpctx.stroke();
    this.lastPenInput = newPenInput;
    this.penHistory.push(this.lastPenInput);
  }
  up(e: PointerEvent) {
    const ctx = this.canvas.ctx!;
    this.canvas.clearTmp();
    let tmpLastPenInput: PenInput | null = null;

    const nowPenColor = this.drawStateStore.penColor;
    const nowPenWidth = this.drawStateStore.penWidth;
    const nowPenHistory = this.penHistory;
    const undoImg = this.imgAtBegin!;
    const draw = () => {
      ctx.strokeStyle = nowPenColor;
      ctx.lineCap = 'round';
      ctx.lineWidth = nowPenWidth;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      for (const penInput of nowPenHistory) {
        if (!tmpLastPenInput) {
          tmpLastPenInput = penInput;
          ctx.moveTo(penInput.x, penInput.y);
          continue;
        }
        ctx.lineTo(penInput.x, penInput.y);
      }
      ctx.stroke();
    };
    draw();
    this.opeHistory.commitOperation({
      redo: async () => {
        draw();
      },
      undo: async () => {
        ctx.putImageData(undoImg, 0, 0);
      }
    });
  }
  cancel() {
    this.canvas.clearTmp();
    this.opeHistory.cancelOperation();
  }
}
