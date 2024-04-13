import { useCanvasSizing } from '@/stores/canvasSizing';
import { eventToPenInput, type PenInput } from './PenInput';
import type { ToolHandler } from './ToolHandler';
import { useOpeHistory } from '@/stores/opeHistory';
import { useWorkPages, type PageWord } from '@/stores/workPages';
import { computed, ref, type ComputedRef, toRaw } from 'vue';
import type { Rect } from '@/lib/types';
import { useDrawState } from '@/stores/drawState';

export class WordToolHandler implements ToolHandler {
  lastPenInput: null | PenInput;
  opeHistory: ReturnType<typeof useOpeHistory>;
  canvasSizing: ReturnType<typeof useCanvasSizing>;
  pageWords: ComputedRef<PageWord[]>;
  getWordElem: (id: number) => HTMLElement | null;
  drawStateStore: ReturnType<typeof useDrawState>;

  mode: 'move' | 'resize' | null = null;
  oldRect: Rect | null = null;
  firstPenInput: PenInput | null = null;

  wordHandleSize() {
    return Math.max(32, 32 / this.canvasSizing.getCanvasScale());
  }
  wordHandleBorderThickness() {
    return Math.max(2, 2 / this.canvasSizing.getCanvasScale());
  }

  focusingWordId = ref<number | null>(null);
  focusingWord = computed(() => {
    return this.pageWords.value.find((word) => word.id === this.focusingWordId.value);
  });

  isTouchingMoveWordHandle(penInput: PenInput, pageWord: PageWord) {
    const moveHandleRect: Rect = {
      left: pageWord.rect.left + pageWord.rect.width,
      top: pageWord.rect.top - this.wordHandleSize(),
      width: this.wordHandleSize(),
      height: this.wordHandleSize()
    };
    return (
      moveHandleRect.left <= penInput.x &&
      penInput.x < moveHandleRect.left + moveHandleRect.width &&
      moveHandleRect.top <= penInput.y &&
      penInput.y < moveHandleRect.top + moveHandleRect.height
    );
  }
  onTouchMoveWordHandle(e: PointerEvent, penInput: PenInput, focusingWord: PageWord) {
    this.opeHistory.beginOperation();
    this.mode = 'move';
    this.oldRect = structuredClone(toRaw(focusingWord.rect));
    this.firstPenInput = penInput;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  isTouchingResizeWordHandle(penInput: PenInput, pageWord: PageWord) {
    const resizeHandleRect: Rect = {
      left: pageWord.rect.left - this.wordHandleSize(),
      top: pageWord.rect.top + pageWord.rect.height,
      width: this.wordHandleSize(),
      height: this.wordHandleSize()
    };
    return (
      resizeHandleRect.left <= penInput.x &&
      penInput.x < resizeHandleRect.left + resizeHandleRect.width &&
      resizeHandleRect.top <= penInput.y &&
      penInput.y < resizeHandleRect.top + resizeHandleRect.height
    );
  }
  onTouchResizeWordHandle(e: PointerEvent, penInput: PenInput, focusingWord: PageWord) {
    this.opeHistory.beginOperation();
    this.mode = 'resize';
    this.oldRect = structuredClone(toRaw(focusingWord.rect));
    this.firstPenInput = penInput;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  findTouchedWordId(penInput: PenInput) {
    for (const pageWord of this.pageWords.value) {
      if (
        pageWord.rect.left <= penInput.x &&
        penInput.x < pageWord.rect.left + pageWord.rect.width &&
        pageWord.rect.top <= penInput.y &&
        penInput.y < pageWord.rect.top + pageWord.rect.height
      )
        return pageWord.id;
    }
    return null;
  }
  onTouchWord(e: PointerEvent, touchedWordId: number) {
    this.focusingWordId.value = touchedWordId;
    const elem = this.getWordElem(touchedWordId);
    if (elem instanceof HTMLElement) {
      elem.focus();
      e.preventDefault();
    }
  }
  beginCreateNewWord(penInput: PenInput) {
    this.opeHistory.beginOperation();
    this.lastPenInput = penInput;
    this.focusingWordId.value = null;

    const newId = this.pageWords.value.length;
    this.pageWords.value.push({
      fontSize: this.drawStateStore.defaultFontSize,
      id: newId,
      rect: {
        left: penInput.x,
        top: penInput.y,
        width: 0,
        height: 0
      },
      word: ''
    });
  }

  constructor(getWordElem: (id: number) => HTMLElement | null) {
    this.lastPenInput = null;
    this.opeHistory = useOpeHistory();
    this.canvasSizing = useCanvasSizing();
    this.drawStateStore = useDrawState();

    const workPagesStore = useWorkPages();
    this.pageWords = computed(() =>
      workPagesStore.currentPage ? workPagesStore.currentPage.words : []
    );
    this.getWordElem = getWordElem;
  }
  down(e: PointerEvent) {
    const penInput = eventToPenInput(e);

    if (this.focusingWord.value) {
      if (this.isTouchingMoveWordHandle(penInput, this.focusingWord.value)) {
        this.onTouchMoveWordHandle(e, penInput, this.focusingWord.value);
        return;
      }
      if (this.isTouchingResizeWordHandle(penInput, this.focusingWord.value)) {
        this.onTouchResizeWordHandle(e, penInput, this.focusingWord.value);
        return;
      }
    }

    const touchedWordId = this.findTouchedWordId(penInput);
    if (touchedWordId !== null) {
      this.onTouchWord(e, touchedWordId);
      return;
    }
    this.beginCreateNewWord(penInput);
  }
  move(e: PointerEvent) {
    if (!this.opeHistory.isOperating()) return;
    const penInput = eventToPenInput(e);
    if (this.mode === 'move') {
      const x2 = penInput.x + (this.oldRect!.left + this.oldRect!.width - this.firstPenInput!.x);
      const y2 = penInput.y + (this.oldRect!.top - this.firstPenInput!.y);

      this.focusingWord.value!.rect = {
        left: x2 - this.oldRect!.width,
        top: y2,
        width: this.oldRect!.width,
        height: this.oldRect!.height
      };
    } else if (this.mode === 'resize') {
      const x2 = penInput.x + (this.oldRect!.left - this.firstPenInput!.x);
      const y2 = penInput.y + (this.oldRect!.top + this.oldRect!.height - this.firstPenInput!.y);
      this.focusingWord.value!.rect = {
        left: x2,
        top: Math.min(this.oldRect!.top, y2),
        width: Math.max(this.oldRect!.left + this.oldRect!.width - x2, 0),
        height: Math.max(y2 - this.oldRect!.top, 0)
      };
    } else {
      this.pageWords.value[this.pageWords.value.length - 1].rect = {
        left: Math.min(penInput.x, this.lastPenInput!.x),
        top: Math.min(penInput.y, this.lastPenInput!.y),
        width: Math.abs(penInput.x - this.lastPenInput!.x),
        height: Math.abs(penInput.y - this.lastPenInput!.y)
      };
    }
  }
  up(e: PointerEvent) {
    if (!this.opeHistory.isOperating()) return;

    if (this.mode === 'move' || this.mode === 'resize') {
      const id = this.focusingWordId.value;
      const oldRect = this.oldRect!;
      const newRect = this.focusingWord.value!.rect;
      this.opeHistory.commitOperation({
        undo: async () => {
          this.pageWords.value.find((word) => {
            return word.id === id;
          })!.rect = oldRect;
        },
        redo: async () => {
          this.pageWords.value.find((word) => {
            return word.id === id;
          })!.rect = newRect;
        }
      });
      this.mode = null;
      return;
    }

    const working = this.pageWords.value[this.pageWords.value.length - 1];
    if (working.rect.width < 30 || working.rect.height < 30) {
      this.pageWords.value.pop();
      this.opeHistory.cancelOperation();
      return;
    }
    const elem = this.getWordElem(working.id);
    if (elem instanceof HTMLElement) {
      this.focusingWordId.value = working.id;
      elem.focus();
    }

    this.opeHistory.commitOperation({
      undo: async () => {
        const targetIndex = this.pageWords.value.findIndex((val) => val.id == working.id);
        this.pageWords.value.splice(targetIndex, 1);
      },
      redo: async () => {
        this.pageWords.value.push(working);
      }
    });
  }

  tryDeleteWord() {
    const targetId = this.focusingWordId.value;
    const index = this.pageWords.value.findIndex((word) => word.id === targetId);
    if (index !== -1) {
      this.opeHistory.beginOperation();
      const word = this.pageWords.value[index];
      this.pageWords.value.splice(index, 1);
      this.opeHistory.commitOperation({
        redo: async () => {
          const index = this.pageWords.value.findIndex((word) => word.id === targetId);
          if (index !== -1) this.pageWords.value.splice(index, 1);
        },
        undo: async () => {
          this.pageWords.value.push(word);
        }
      });
    }
  }
  cancel() {
    if (this.mode === 'move' || this.mode === 'resize') {
      const id = this.focusingWordId.value;
      const oldRect = this.oldRect!;
      this.pageWords.value.find((word) => {
        return word.id === id;
      })!.rect = oldRect;
      this.mode = null;
    } else {
      this.pageWords.value.pop();
    }

    this.opeHistory.cancelOperation();
  }
}
