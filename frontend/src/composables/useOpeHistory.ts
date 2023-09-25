export const useOpeHistory = (getImage: () => ImageData, ctx: CanvasRenderingContext2D) => {
  let isOperating = true;
  const drawHistory: ImageData[] = [];
  const undoHistory: ImageData[] = [];
  function beginOperation() {
    isOperating = true;
    saveDrawHistory();
  }
  function endOperation() {
    isOperating = false;
    undoHistory.length = 0;
  }
  function saveDrawHistory() {
    drawHistory.push(getImage());
  }
  function saveUndoHistory() {
    undoHistory.push(getImage());
  }
  function tryUndo() {
    if (isOperating) return;

    const last = drawHistory.pop();
    if (!last) return;
    saveUndoHistory();
    ctx.putImageData(last, 0, 0);
  }
  function tryRedo() {
    if (isOperating) return;

    const last = undoHistory.pop();
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
