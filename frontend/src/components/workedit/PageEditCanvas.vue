<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useDrawMode } from '@/stores/drawMode';
import { useDrawState } from '@/stores/drawState';
import { useCanvasSizing } from '@/composables/useCanvasSizing';
import { useKeyboard } from '@/composables/useKeyboard';
import { useWorkPages } from '@/stores/workPages';

// show implementation
const canvasSizing = useCanvasSizing();
const isFinger = (e: PointerEvent) => e.pointerType == 'touch';

// drawing implementation
const tmpCanvasRef = ref(null);
const mainCanvasRef = ref(null);

let drawing: {
  tmpCanvas: HTMLCanvasElement;
  mainCanvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tmpctx: CanvasRenderingContext2D;
} | null = null;

onMounted(() => {
  const tmpCanvas = tmpCanvasRef.value as any;
  const mainCanvas = mainCanvasRef.value as any;
  if (!(tmpCanvas instanceof HTMLCanvasElement)) return;
  if (!(mainCanvas instanceof HTMLCanvasElement)) return;

  const tmpctx = tmpCanvas.getContext('2d');
  if (!tmpctx) return;
  const ctx = mainCanvas.getContext('2d');
  if (!ctx) return;

  drawing = {
    tmpCanvas: tmpCanvas,
    mainCanvas: mainCanvas,
    ctx: ctx,
    tmpctx: tmpctx
  };
});

type PenInput = {
  x: number;
  y: number;
  pressure: number;
};

let penHistory: Array<PenInput> = [];
let lastPenInput: PenInput | null = null;

const eventToPenInput = (e: PointerEvent) => {
  const p = canvasSizing.clientToCanvas(e.clientX, e.clientY);
  return {
    x: p.x,
    y: p.y,
    pressure: e.pressure
  };
};

const drawModeStore = useDrawMode();
const drawStateStore = useDrawState();

async function getImgCompressed() {
  const img = getImage();
  const blob = new Blob([img.data.buffer]);
  const stream = blob.stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('deflate-raw'));
  const buffer = await new Response(compressedStream).arrayBuffer();
  return new Uint8Array(buffer);
}
async function putImgCompressed(data: Uint8Array) {
  const blob = new Blob([data]);
  const stream = blob.stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(decompressedStream).arrayBuffer();
  return new Uint8ClampedArray(buffer);
}

const workPagesStore = useWorkPages();

async function saveNowPage() {
  workPagesStore.pages.length = Math.max(workPagesStore.pages.length, workPagesStore.nowPage + 1);
  workPagesStore.pages[workPagesStore.nowPage] = await getImgCompressed();
}
async function loadNowPage() {
  const ctx = drawing!.ctx;
  workPagesStore.pages.length = Math.max(workPagesStore.pages.length, workPagesStore.nowPage + 1);
  const data = workPagesStore.pages[workPagesStore.nowPage];
  if (data) {
    const imgData = new ImageData(
      await putImgCompressed(data),
      canvasSizing.canvasWidth.value,
      canvasSizing.canvasHeight.value
    );
    ctx.clearRect(0, 0, canvasSizing.canvasWidth.value, canvasSizing.canvasHeight.value);
    ctx.putImageData(imgData, 0, 0);
  } else {
    ctx.clearRect(0, 0, canvasSizing.canvasWidth.value, canvasSizing.canvasHeight.value);
  }
  canvasSizing.initView();
}

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
function getImage() {
  return drawing!.ctx.getImageData(
    0,
    0,
    canvasSizing.canvasWidth.value,
    canvasSizing.canvasHeight.value
  );
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
  drawing!.ctx.putImageData(last, 0, 0);
}
function tryRedo() {
  if (isOperating) return;
  const last = undoHistory.pop();
  if (!last) return;
  saveDrawHistory();
  drawing!.ctx.putImageData(last, 0, 0);
}
useKeyboard(
  async (e) => {
    if (e.ctrlKey && e.key == 'z') {
      tryUndo();
    }
    if (e.ctrlKey && e.key == 'y') {
      tryRedo();
    }
    if (e.key == 'ArrowRight') {
      await saveNowPage();
      workPagesStore.nowPage++;
      await loadNowPage();
      console.log(workPagesStore.nowPage);
    }
    if (e.key == 'ArrowLeft') {
      if (workPagesStore.nowPage > 0) {
        await saveNowPage();
        workPagesStore.nowPage--;
        await loadNowPage();
        console.log(workPagesStore.nowPage);
      }
    }
  },
  () => {}
);

type ToolHandler = {
  down: (e: PointerEvent) => void;
  move: (e: PointerEvent) => void;
  up: (e: PointerEvent) => void;
};

const moveToolHandler: ToolHandler = {
  down: (e: PointerEvent) => {
    canvasSizing.touchManager.onfingerdown(e);
  },
  move: (e: PointerEvent) => {
    canvasSizing.touchManager.onfingermove(e);
  },
  up: (e: PointerEvent) => {
    canvasSizing.touchManager.onfingerup(e);
  }
};

const penToolHandler: ToolHandler = {
  down: (e: PointerEvent) => {
    beginOperation();
    penHistory = [];
    lastPenInput = eventToPenInput(e);
    penHistory.push(lastPenInput);

    const tmpctx = drawing!.tmpctx;
    tmpctx.strokeStyle = drawStateStore.penColor;
    tmpctx.lineCap = 'round';
    tmpctx.lineWidth = drawStateStore.penWidth;
    tmpctx.globalCompositeOperation = 'source-over';
  },
  move: (e: PointerEvent) => {
    const newPenInput = eventToPenInput(e);
    const ctx = drawing!.tmpctx;
    ctx.beginPath();
    ctx.moveTo(lastPenInput!.x, lastPenInput!.y);
    ctx.lineTo(newPenInput!.x, newPenInput!.y);
    ctx.stroke();
    lastPenInput = newPenInput;
    penHistory.push(lastPenInput);
  },
  up: (e: PointerEvent) => {
    const tmpctx = drawing!.tmpctx;
    const ctx = drawing!.ctx;
    tmpctx.clearRect(0, 0, canvasSizing.canvasWidth.value, canvasSizing.canvasHeight.value);
    let tmpLastPenInput: PenInput | null = null;

    ctx.strokeStyle = drawStateStore.penColor;
    ctx.lineCap = 'round';
    ctx.lineWidth = drawStateStore.penWidth;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    for (const penInput of penHistory) {
      if (!tmpLastPenInput) {
        tmpLastPenInput = penInput;
        ctx.moveTo(penInput.x, penInput.y);
        continue;
      }
      ctx.lineTo(penInput.x, penInput.y);
    }
    ctx.stroke();
    endOperation();
  }
};

const eraserToolHandler: ToolHandler = {
  down: (e: PointerEvent) => {
    beginOperation();
    penHistory = [];
    lastPenInput = eventToPenInput(e);
    penHistory.push(lastPenInput);

    const ctx = drawing!.ctx;
    ctx.lineCap = 'round';
    ctx.lineWidth = drawStateStore.eraserWidth;
    ctx.globalCompositeOperation = 'destination-out';
  },
  move: (e: PointerEvent) => {
    const newPenInput = eventToPenInput(e);
    const ctx = drawing!.ctx;
    ctx.beginPath();
    ctx.moveTo(lastPenInput!.x, lastPenInput!.y);
    ctx.lineTo(newPenInput!.x, newPenInput!.y);
    ctx.stroke();
    lastPenInput = newPenInput;
    penHistory.push(lastPenInput);
  },
  up: (e: PointerEvent) => {
    endOperation();
  }
};

const wordToolHandler: ToolHandler = {
  down: (e: PointerEvent) => {},
  move: (e: PointerEvent) => {},
  up: (e: PointerEvent) => {}
};

const toolHandlers = {
  move: moveToolHandler,
  pen: penToolHandler,
  eraser: eraserToolHandler,
  word: wordToolHandler
};

let toolHandler = toolHandlers[drawModeStore.mode];

const penDownHandler = (e: PointerEvent) => {
  toolHandler = toolHandlers[drawModeStore.mode];
  toolHandler.down(e);
};
const penMoveHandler = (e: PointerEvent) => {
  toolHandler.move(e);
};
const penUpHandler = (e: PointerEvent) => {
  toolHandler.up(e);
};

let nowPenDown = false;
const onpendown = (e: PointerEvent) => {
  if (!drawing) return;
  nowPenDown = true;
  penHistory = [];
  penDownHandler(e);
};
const onpenmove = (e: PointerEvent) => {
  if (!drawing) return;
  if (nowPenDown) {
    penHistory.push(eventToPenInput(e));
    penMoveHandler(e);
  }
};
const onpenup = (e: PointerEvent) => {
  if (!drawing || !nowPenDown) return;
  penUpHandler(e);
  nowPenDown = false;
};

// event handlers
const onpointerup = (e: PointerEvent) => {
  if (isFinger(e)) canvasSizing.touchManager.onfingerup(e);
  else onpenup(e);
};
const onpointermove = (e: PointerEvent) => {
  if (isFinger(e)) canvasSizing.touchManager.onfingermove(e);
  else onpenmove(e);
};
const onpointerdown = (e: PointerEvent) => {
  if (isFinger(e)) canvasSizing.touchManager.onfingerdown(e);
  else onpendown(e);
};
</script>

<template>
  <div :class="$style.canvasSystem">
    <canvas
      :style="canvasSizing.canvasStyle.value"
      :class="$style.mainCanvas"
      :width="canvasSizing.canvasWidth.value"
      :height="canvasSizing.canvasHeight.value"
      ref="mainCanvasRef"
    ></canvas>
    <canvas
      :style="canvasSizing.canvasStyle.value"
      :class="$style.tmpCanvas"
      :width="canvasSizing.canvasWidth.value"
      :height="canvasSizing.canvasHeight.value"
      ref="tmpCanvasRef"
    ></canvas>
    <div
      :class="$style.surface"
      :onpointerdown="onpointerdown"
      :onpointermove="onpointermove"
      :onpointerup="onpointerup"
      :onpointercancel="onpointerup"
      :onpointerout="onpointerup"
      :onpointerleave="onpointerup"
      :onwheel="canvasSizing.onwheel"
    ></div>
  </div>
</template>

<style module>
.canvasSystem {
  height: 100vh;
  background-color: #888;
}
.mainCanvas,
.tmpCanvas {
  position: absolute;
}

.mainCanvas {
  background-color: #fff;
}

.tmpCanvas {
  background-color: transparent;
}

.surface {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
