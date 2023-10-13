import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWorkPages } from './workPages';
import { usePageOperation } from '@/composables/usePageOperation';

export type Operation = {
  undo: () => Promise<any>;
  redo: () => Promise<any>;
};

export const useOpeHistory = defineStore('opeHistory', () => {
  const isOperating = ref(false);
  const drawHistory = ref<Operation[]>([]);
  const undoHistory = ref<Operation[]>([]);

  const workPages = useWorkPages();
  const pageOperation = usePageOperation();

  function beginOperation() {
    if (isOperating.value) throw new Error('already operation running');
    isOperating.value = true;
  }
  function cancelOperation() {
    isOperating.value = false;
  }
  function commitOperation(op: Operation) {
    isOperating.value = false;
    const opePage = pageOperation.currentPageIndex.value;
    drawHistory.value.push({
      redo: async () => {
        await pageOperation.tryGotoPageByIndex(opePage);
        op.redo();
      },
      undo: async () => {
        await pageOperation.tryGotoPageByIndex(opePage);
        op.undo();
      }
    });
    undoHistory.value.length = 0;
    workPages.pageUpdated = true;
  }

  async function tryUndo() {
    if (isOperating.value) return;

    const last = drawHistory.value.pop();
    if (!last) return;
    isOperating.value = true;
    undoHistory.value.push(last);
    await last.undo();
    isOperating.value = false;
  }
  async function tryRedo() {
    if (isOperating.value) return;

    const last = undoHistory.value.pop();
    if (!last) return;
    isOperating.value = true;
    drawHistory.value.push(last);
    await last.redo();
    isOperating.value = false;
  }

  function clearHistory() {
    undoHistory.value = [];
    drawHistory.value = [];
  }

  function isUndoAvailable() {
    return drawHistory.value.length > 0;
  }
  function isRedoAvailable() {
    return undoHistory.value.length > 0;
  }

  return {
    beginOperation,
    cancelOperation,
    commitOperation,
    tryRedo,
    tryUndo,
    clearHistory,
    isOperating: () => {
      return isOperating.value;
    },
    isUndoAvailable,
    isRedoAvailable
  };
});
