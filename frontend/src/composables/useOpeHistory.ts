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
    if (isOperating) return;

    const last = drawHistoryOld.pop();
    if (!last) return;
    saveUndoHistory();
    ctx.putImageData(last, 0, 0);
  }
  function tryRedo() {
    if (isOperating) return;

    const last = undoHistoryOld.pop();
    if (!last) return;
    saveDrawHistory();
    ctx.putImageData(last, 0, 0);
  }

  return {
    beginOperation,
    endOperation,
    tryUndo,
    tryRedo,
    isOperating: () => {
      return isOperating;
    }
  };
};
