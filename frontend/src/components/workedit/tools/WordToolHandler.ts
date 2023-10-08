import { useCanvasSizing } from '@/stores/canvasSizing';
import { eventToPenInput, type PenInput } from './PenInput';
import type { ToolHandler } from './ToolHandler';
import { useOpeHistory } from '@/stores/opeHistory';
import { useWorkPages, type PageWord } from '@/stores/workPages';
import { computed, ref, type ComputedRef, toRaw } from 'vue';
import type { Rect } from '@/lib/types';

export class WordToolHandler implements ToolHandler {
  lastPenInput: null | PenInput;
  opeHistory: ReturnType<typeof useOpeHistory>;
  canvasSizing: ReturnType<typeof useCanvasSizing>;
  pageWords: ComputedRef<PageWord[]>;
  getWordElem: (id: number) => HTMLElement | null;
  onSelect: (id: number) => void | null;

  mode: 'move' | 'resize' | null = null;
  oldRect: Rect | null = null;

  wordHandleSize() {
    return Math.max(32, 32 / this.canvasSizing.getCanvasScale());
  }
  wordHandleBorderThickness() {
    return Math.max(2, 2 / this.canvasSizing.getCanvasScale());
  }

  lastSelectedWordId = ref<number | null>(null);
  lastSelectedWord = computed(() => {
    return this.pageWords.value.find((word) => word.id === this.lastSelectedWordId.value);
  });

  constructor(
    getWordElem: (id: number) => HTMLElement | null,
    onSelect: (id: number) => void | null
  ) {
    this.lastPenInput = null;
    this.opeHistory = useOpeHistory();
    this.canvasSizing = useCanvasSizing();

    const workPagesStore = useWorkPages();
    this.pageWords = computed(() =>
      workPagesStore.currentPage ? workPagesStore.currentPage.words : []
    );
    this.getWordElem = getWordElem;
    this.onSelect = onSelect;
  }
  down(e: PointerEvent) {
    const penInput = eventToPenInput(e);

    if (this.lastSelectedWord.value) {
      // move handle
      const moveHandleRect: Rect = {
        left: this.lastSelectedWord.value.rect.left + this.lastSelectedWord.value.rect.width,
        top: this.lastSelectedWord.value.rect.top - this.wordHandleSize(),
        width: this.wordHandleSize(),
        height: this.wordHandleSize()
      };
      if (
        moveHandleRect.left <= penInput.x &&
        penInput.x < moveHandleRect.left + moveHandleRect.width &&
        moveHandleRect.top <= penInput.y &&
        penInput.y < moveHandleRect.top + moveHandleRect.height
      ) {
        this.opeHistory.beginOperation();
        this.mode = 'move';
        this.oldRect = structuredClone(toRaw(this.lastSelectedWord.value.rect));
        return;
      }
      // resize handle
      const resizeHandleRect: Rect = {
        left: this.lastSelectedWord.value.rect.left - this.wordHandleSize(),
        top: this.lastSelectedWord.value.rect.top + this.lastSelectedWord.value.rect.height,
        width: this.wordHandleSize(),
        height: this.wordHandleSize()
      };
      if (
        resizeHandleRect.left <= penInput.x &&
        penInput.x < resizeHandleRect.left + resizeHandleRect.width &&
        resizeHandleRect.top <= penInput.y &&
        penInput.y < resizeHandleRect.top + resizeHandleRect.height
      ) {
        this.opeHistory.beginOperation();
        this.mode = 'resize';
        this.oldRect = structuredClone(toRaw(this.lastSelectedWord.value.rect));
        return;
      }
      this.mode = null;
    }

    let tmpPageWordId: number | null = null;
    for (const pageWord of this.pageWords.value) {
      if (
        pageWord.rect.left <= penInput.x &&
        penInput.x < pageWord.rect.left + pageWord.rect.width &&
        pageWord.rect.top <= penInput.y &&
        penInput.y < pageWord.rect.top + pageWord.rect.height
      )
        tmpPageWordId = pageWord.id;
    }
    if (tmpPageWordId !== null) {
      this.lastSelectedWordId.value = tmpPageWordId;
      const elem = this.getWordElem(tmpPageWordId);
      if (elem instanceof HTMLElement) {
        elem.focus();
        this.onSelect(tmpPageWordId);
        e.preventDefault();
        return;
      }
    }
    this.opeHistory.beginOperation();
    this.lastPenInput = penInput;
    this.pageWords.value.push({
      fontSize: 32,
      id: this.pageWords.value.length,
      rect: {
        left: penInput.x,
        top: penInput.y,
        width: 0,
        height: 0
      },
      word: ''
    });
  }
  move(e: PointerEvent) {
    if (!this.opeHistory.isOperating()) return;
    const penInput = eventToPenInput(e);
    if (this.mode === 'move') {
      this.lastSelectedWord.value!.rect = {
        left: penInput.x - this.oldRect!.width,
        top: penInput.y,
        width: this.oldRect!.width,
        height: this.oldRect!.height
      };
    } else if (this.mode === 'resize') {
      this.lastSelectedWord.value!.rect = {
        left: penInput.x,
        top: Math.min(this.oldRect!.top, penInput.y),
        width: Math.max(this.oldRect!.left + this.oldRect!.width - penInput.x, 0),
        height: Math.max(penInput.y - this.oldRect!.top, 0)
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
      const id = this.lastSelectedWordId.value;
      const oldRect = this.oldRect!;
      const newRect = this.lastSelectedWord.value!.rect;
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
    const elem = document.querySelector(`[data-word-id="${working.id}"]`);
    if (elem instanceof HTMLElement) {
      this.onSelect(working.id);
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
}
