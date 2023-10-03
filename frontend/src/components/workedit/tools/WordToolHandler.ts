import type { useCanvasSizing } from '@/composables/useCanvasSizing';
import { eventToPenInput, type PenInput } from './PenInput';
import type { ToolHandler } from './ToolHandler';
import type { useOpeHistory } from '@/composables/useOpeHistory';
import { useWorkPages, type PageWord } from '@/stores/workPages';
import { computed, type ComputedRef } from 'vue';

export class WordToolHandler implements ToolHandler {
  lastPenInput: null | PenInput;
  opeHistory: ReturnType<typeof useOpeHistory>;
  canvasSizing: ReturnType<typeof useCanvasSizing>;
  pageWords: ComputedRef<PageWord[]>;
  getWordElem: (id: number) => HTMLElement | null;
  applyWordChanges: () => void;

  constructor(
    opeHistory: ReturnType<typeof useOpeHistory>,
    canvasSizing: ReturnType<typeof useCanvasSizing>,
    getWordElem: (id: number) => HTMLElement | null,
    applyWordChanges: () => void
  ) {
    this.lastPenInput = null;
    this.opeHistory = opeHistory;
    this.canvasSizing = canvasSizing;

    const workPagesStore = useWorkPages();
    this.pageWords = computed(() =>
      workPagesStore.currentPage ? workPagesStore.currentPage.words : []
    );
    this.getWordElem = getWordElem;
    this.applyWordChanges = applyWordChanges;
  }
  down(e: PointerEvent) {
    const penInput = eventToPenInput(e, this.canvasSizing);
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
      const elem = this.getWordElem(tmpPageWordId);
      if (elem instanceof HTMLElement) {
        elem.focus();
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
    const penInput = eventToPenInput(e, this.canvasSizing);
    this.pageWords.value[this.pageWords.value.length - 1].rect = {
      left: Math.min(penInput.x, this.lastPenInput!.x),
      top: Math.min(penInput.y, this.lastPenInput!.y),
      width: Math.abs(penInput.x - this.lastPenInput!.x),
      height: Math.abs(penInput.y - this.lastPenInput!.y)
    };
  }
  up(e: PointerEvent) {
    if (!this.opeHistory.isOperating()) return;
    const working = this.pageWords.value[this.pageWords.value.length - 1];
    if (working.rect.width < 30 || working.rect.height < 30) {
      this.pageWords.value.pop();
      this.opeHistory.cancelOperation();
      return;
    }
    const elem = document.querySelector(`[data-word-id="${working.id}"]`);
    if (elem instanceof HTMLElement) elem.focus();

    this.opeHistory.commitOperation({
      undo: () => {
        this.applyWordChanges();
        const targetIndex = this.pageWords.value.findIndex((val) => val.id == working.id);
        this.pageWords.value.splice(targetIndex, 1);
      },
      redo: () => {
        this.pageWords.value.push(working);
      }
    });
  }
}
