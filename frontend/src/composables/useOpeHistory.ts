export type Operation = {
  undo: () => void;
  redo: () => void;
};

export const useOpeHistory = (getImage: () => ImageData, ctx: CanvasRenderingContext2D) => {
  let isOperating = true;

  const drawHistoryOld: ImageData[] = []; // deprecated
  const undoHistoryOld: ImageData[] = []; // deprecated
  // deprecated
  function beginOperation() {
    isOperating = true;
    saveDrawHistory();
  }
  // deprecated
  function endOperation() {
    isOperating = false;
    undoHistoryOld.length = 0;
  }

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

  function saveDrawHistory() {
    drawHistoryOld.push(getImage());
  }
  function saveUndoHistory() {
    undoHistoryOld.push(getImage());
  }
  function tryUndo() {
    // deprecated
    if (isOperating) return;

    const last = drawHistoryOld.pop();
    if (!last) return;
    saveUndoHistory();
    ctx.putImageData(last, 0, 0);
  }
  function tryRedo() {
    // deprecated
    if (isOperating) return;

    const last = undoHistoryOld.pop();
    if (!last) return;
    saveDrawHistory();
    ctx.putImageData(last, 0, 0);
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
    beginOperation,
    endOperation,
    tryUndo,
    tryRedo,

    beginOperation2,
    commitOperation,
    tryRedo2,
    tryUndo2,

    isOperating: () => {
      return isOperating;
    }
  };
};
