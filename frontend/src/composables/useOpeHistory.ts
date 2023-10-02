export type Operation = {
  undo: () => void;
  redo: () => void;
};

export const useOpeHistory = (getImage: () => ImageData, ctx: CanvasRenderingContext2D) => {
  let isOperating = true;
  const drawHistory: Operation[] = [];
  const undoHistory: Operation[] = [];
  function beginOperation2() {
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

  function tryUndo2() {
    if (isOperating) return;

    const last = drawHistory.pop();
    if (!last) return;
    undoHistory.push(last);
    last.undo();
  }
  function tryRedo2() {
    if (isOperating) return;

    const last = undoHistory.pop();
    if (!last) return;
    drawHistory.push(last);
    last.redo();
  }

  return {
    beginOperation2,
    cancelOperation,
    commitOperation,
    tryRedo2,
    tryUndo2,

    isOperating: () => {
      return isOperating;
    }
  };
};
