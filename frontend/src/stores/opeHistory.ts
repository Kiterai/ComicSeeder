import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Operation = {
  undo: () => void;
  redo: () => void;
};

export const useOpeHistory = defineStore('opeHistory', () => {
  const isOperating = ref(true);
  const drawHistory = ref<Operation[]>([]);
  const undoHistory = ref<Operation[]>([]);
  function beginOperation() {
    isOperating.value = true;
  }
  function cancelOperation() {
    isOperating.value = false;
  }
  function commitOperation(op: Operation) {
    isOperating.value = false;
    drawHistory.value.push(op);
    undoHistory.value.length = 0;
  }

  function tryUndo() {
    if (isOperating.value) return;

    const last = drawHistory.value.pop();
    if (!last) return;
    undoHistory.value.push(last);
    last.undo();
  }
  function tryRedo() {
    if (isOperating.value) return;

    const last = undoHistory.value.pop();
    if (!last) return;
    drawHistory.value.push(last);
    last.redo();
  }

  return {
    beginOperation,
    cancelOperation,
    commitOperation,
    tryRedo,
    tryUndo,

    isOperating: () => {
      return isOperating;
    }
  };
});
