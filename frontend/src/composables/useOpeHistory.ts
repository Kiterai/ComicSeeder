export type Operation = {
  undo: () => void;
  redo: () => void;
};

export const useOpeHistory = () => {
  let isOperating = true;
  const drawHistory: Operation[] = [];
  const undoHistory: Operation[] = [];
  function beginOperation() {
    isOperating = true;
  }
  function cancelOperation() {
    isOperating = false;
  }
  function commitOperation(op: Operation) {
    isOperating = false;
    drawHistory.push(op);
    undoHistory.length = 0;
  }

  function tryUndo() {
    if (isOperating) return;

    const last = drawHistory.pop();
    if (!last) return;
    undoHistory.push(last);
    last.undo();
  }
  function tryRedo() {
    if (isOperating) return;

    const last = undoHistory.pop();
    if (!last) return;
    drawHistory.push(last);
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
};
