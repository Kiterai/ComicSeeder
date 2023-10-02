<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';
import { useDrawMode } from '@/stores/drawMode';
import { useDrawState } from '@/stores/drawState';
import { useCanvas } from '@/stores/canvas';
import { useCanvasSizing } from '@/composables/useCanvasSizing';
import { useKeyboard } from '@/composables/useKeyboard';
import { useOpeHistory } from '@/composables/useOpeHistory';
import { useWorkPages, type PageData, type PageWord } from '@/stores/workPages';
import { usePageOperation } from '@/composables/usePageOperation';
import { type ToolHandler } from './tools/ToolHandler';
import { MoveToolHandler } from './tools/MoveToolHandler';
import { eventToPenInput, type PenInput } from './tools/PenInput';

// show implementation
const canvasSizing = useCanvasSizing();
const isFinger = (e: PointerEvent) => e.pointerType == 'touch';

// drawing implementation
const tmpCanvasRef = ref(null);
const mainCanvasRef = ref(null);

let opeHistory: ReturnType<typeof useOpeHistory> | null = null;
let pageOperation: ReturnType<typeof usePageOperation> | null = null;

const canvas = useCanvas();

onMounted(() => {
  const tmpCanvas = tmpCanvasRef.value as any;
  const mainCanvas = mainCanvasRef.value as any;
  if (!(tmpCanvas instanceof HTMLCanvasElement)) return;
  if (!(mainCanvas instanceof HTMLCanvasElement)) return;

  canvas.setup(mainCanvas, tmpCanvas);

  opeHistory = useOpeHistory(canvas.getImage, canvas.ctx!);
  pageOperation = usePageOperation(
    canvas.ctx!,
    applyWordChanges,
    getImgCompressed,
    getImgDecompressed,
    canvasSizing,
    pageWords
  );
});

const drawModeStore = useDrawMode();
const drawStateStore = useDrawState();

async function getImgCompressed() {
  const img = canvas.getImage();
  const blob = new Blob([img.data.buffer]);
  const stream = blob.stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('deflate-raw'));
  const buffer = await new Response(compressedStream).arrayBuffer();
  return new Uint8Array(buffer);
}
async function getImgDecompressed(data: Uint8Array) {
  const blob = new Blob([data]);
  const stream = blob.stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(decompressedStream).arrayBuffer();
  return new Uint8ClampedArray(buffer);
}

const workPagesStore = useWorkPages();

function getWordElem(id: number) {
  const elem = document.querySelector(`[data-word-id="${id}"]`);
  if (elem instanceof HTMLElement) return elem;
  return null;
}
function applyWordChanges() {
  for (let i = 0; i < pageWords.value.length; i++) {
    const elem = getWordElem(pageWords.value[i].id);
    if (elem) pageWords.value[i].word = elem.innerText;
  }
}

useKeyboard(
  async (e) => {
    if (e.ctrlKey && e.key == 'z') {
      if (drawModeStore.mode == 'word') return;
      opeHistory!.tryUndo2();
    }
    if (e.ctrlKey && e.key == 'y') {
      if (drawModeStore.mode == 'word') return;
      opeHistory!.tryRedo2();
    }
    if (e.key == 'ArrowRight') {
      await pageOperation!.tryGotoNextPage();
    }
    if (e.key == 'ArrowLeft') {
      await pageOperation!.tryGotoPrevPage();
    }
    if (e.key == 'D') {
      await pageOperation!.tryDeleteNowPage();
    }
  },
  () => {}
);

class PenToolHandler implements ToolHandler {
  imgAtBegin: null | ImageData;
  penHistory: PenInput[];
  lastPenInput: null | PenInput;
  constructor() {
    this.imgAtBegin = null;
    this.penHistory = [];
    this.lastPenInput = null;
  }
  down(e: PointerEvent) {
    opeHistory!.beginOperation2();
    this.penHistory = [];
    this.lastPenInput = eventToPenInput(e, canvasSizing);
    this.penHistory.push(this.lastPenInput);

    this.imgAtBegin = canvas.getImage();
    const tmpctx = canvas.tmpctx!;
    tmpctx.strokeStyle = drawStateStore.penColor;
    tmpctx.lineCap = 'round';
    tmpctx.lineWidth = drawStateStore.penWidth;
    tmpctx.globalCompositeOperation = 'source-over';
  }
  move(e: PointerEvent) {
    const newPenInput = eventToPenInput(e, canvasSizing);
    const tmpctx = canvas.tmpctx!;
    tmpctx.beginPath();
    tmpctx.moveTo(this.lastPenInput!.x, this.lastPenInput!.y);
    tmpctx.lineTo(newPenInput!.x, newPenInput!.y);
    tmpctx.stroke();
    this.lastPenInput = newPenInput;
    this.penHistory.push(this.lastPenInput);
  }
  up(e: PointerEvent) {
    const tmpctx = canvas.tmpctx!;
    const ctx = canvas.ctx!;
    tmpctx.clearRect(0, 0, canvasSizing.canvasWidth.value, canvasSizing.canvasHeight.value);
    let tmpLastPenInput: PenInput | null = null;

    const nowPenColor = drawStateStore.penColor;
    const nowPenWidth = drawStateStore.penWidth;
    const nowPenHistory = this.penHistory;
    const nowPage = workPagesStore.nowPageIndex;
    const undoImg = this.imgAtBegin!;
    const draw = () => {
      ctx.strokeStyle = nowPenColor;
      ctx.lineCap = 'round';
      ctx.lineWidth = nowPenWidth;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      for (const penInput of nowPenHistory) {
        if (!tmpLastPenInput) {
          tmpLastPenInput = penInput;
          ctx.moveTo(penInput.x, penInput.y);
          continue;
        }
        ctx.lineTo(penInput.x, penInput.y);
      }
      ctx.stroke();
    };
    draw();
    opeHistory!.commitOperation({
      redo: () => {
        draw();
      },
      undo: () => {
        ctx.putImageData(undoImg, 0, 0);
      }
    });
  }
}

class EraserToolHandler implements ToolHandler {
  imgAtBegin: null | ImageData;
  penHistory: PenInput[];
  lastPenInput: null | PenInput;
  constructor() {
    this.imgAtBegin = null;
    this.penHistory = [];
    this.lastPenInput = null;
  }
  down(e: PointerEvent) {
    opeHistory!.beginOperation2();
    this.penHistory = [];
    this.lastPenInput = eventToPenInput(e, canvasSizing);
    this.penHistory.push(this.lastPenInput);

    this.imgAtBegin = canvas.getImage();
    const ctx = canvas.ctx!;
    ctx.lineCap = 'round';
    ctx.lineWidth = drawStateStore.eraserWidth;
    ctx.globalCompositeOperation = 'destination-out';
  }
  move(e: PointerEvent) {
    const newPenInput = eventToPenInput(e, canvasSizing);
    const ctx = canvas.ctx!;
    ctx.beginPath();
    ctx.moveTo(this.lastPenInput!.x, this.lastPenInput!.y);
    ctx.lineTo(newPenInput!.x, newPenInput!.y);
    ctx.stroke();
    this.lastPenInput = newPenInput;
    this.penHistory.push(this.lastPenInput);
  }
  up(e: PointerEvent) {
    const undoImg = this.imgAtBegin!;
    const nowPenHistory = this.penHistory;
    const ctx = canvas.ctx!;
    opeHistory!.commitOperation({
      redo: () => {
        let tmpLastPenInput: PenInput | null = null;
        ctx.lineCap = 'round';
        ctx.lineWidth = drawStateStore.eraserWidth;
        ctx.globalCompositeOperation = 'destination-out';
        for (const penInput of nowPenHistory) {
          ctx.beginPath();
          ctx.moveTo(tmpLastPenInput!.x, tmpLastPenInput!.y);
          ctx.lineTo(penInput!.x, penInput!.y);
          ctx.stroke();
          tmpLastPenInput = penInput;
        }
      },
      undo: () => {
        ctx.putImageData(undoImg, 0, 0);
      }
    });
  }
}

const pageWords: Ref<Array<PageWord>> = ref([]);
let pageWordActive = ref(-1);

class WordToolHandler implements ToolHandler {
  lastPenInput: null | PenInput;
  constructor() {
    this.lastPenInput = null;
  }
  down(e: PointerEvent) {
    const penInput = eventToPenInput(e, canvasSizing);
    let tmpPageWordId: number | null = null;
    for (const pageWord of pageWords.value) {
      if (
        pageWord.rect.left <= penInput.x &&
        penInput.x < pageWord.rect.left + pageWord.rect.width &&
        pageWord.rect.top <= penInput.y &&
        penInput.y < pageWord.rect.top + pageWord.rect.height
      )
        tmpPageWordId = pageWord.id;
    }
    if (tmpPageWordId !== null) {
      const elem = getWordElem(tmpPageWordId);
      if (elem instanceof HTMLElement) {
        pageWordActive.value = tmpPageWordId;
        elem.focus();
        e.preventDefault();
        return;
      }
    }
    opeHistory!.beginOperation2();
    this.lastPenInput = penInput;
    pageWords.value.push({
      fontSize: 32,
      id: pageWords.value.length,
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
    if (!opeHistory!.isOperating()) return;
    const penInput = eventToPenInput(e, canvasSizing);
    pageWords.value[pageWords.value.length - 1].rect = {
      left: Math.min(penInput.x, this.lastPenInput!.x),
      top: Math.min(penInput.y, this.lastPenInput!.y),
      width: Math.abs(penInput.x - this.lastPenInput!.x),
      height: Math.abs(penInput.y - this.lastPenInput!.y)
    };
  }
  up(e: PointerEvent) {
    if (!opeHistory!.isOperating()) return;
    const working = pageWords.value[pageWords.value.length - 1];
    if (working.rect.width < 30 || working.rect.height < 30) {
      pageWords.value.pop();
      opeHistory!.cancelOperation();
      return;
    }
    const elem = document.querySelector(`[data-word-id="${working.id}"]`);
    if (elem instanceof HTMLElement) elem.focus();

    opeHistory!.commitOperation({
      undo: () => {
        applyWordChanges();
        pageWords.value = pageWords.value.filter((val) => val.id != working.id);
      },
      redo: () => {
        pageWords.value.push(working);
      }
    });
  }
}

const toolHandlers = {
  move: new MoveToolHandler(canvasSizing.touchManager),
  pen: new PenToolHandler(),
  eraser: new EraserToolHandler(),
  word: new WordToolHandler()
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
  nowPenDown = true;
  penDownHandler(e);
};
const onpenmove = (e: PointerEvent) => {
  if (nowPenDown) {
    penMoveHandler(e);
  }
};
const onpenup = (e: PointerEvent) => {
  if (!nowPenDown) return;
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

const onmousemove = (e: MouseEvent) => {
  const elem = e.target as HTMLElement;
  if (drawModeStore.mode == 'word')
    for (const pageWord of pageWords.value) {
      const pos = canvasSizing.clientToCanvas(e.clientX, e.clientY);
      if (
        pageWord.rect.left <= pos.x &&
        pos.x < pageWord.rect.left + pageWord.rect.width &&
        pageWord.rect.top <= pos.y &&
        pos.y < pageWord.rect.top + pageWord.rect.height
      ) {
        elem.style.cursor = 'vertical-text';
        return;
      }
    }
  elem.style.cursor = 'auto';
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
    <div :style="canvasSizing.canvasStyle.value" :class="$style.pageWordContainer">
      <div
        v-for="pageWord in pageWords"
        :key="pageWord.id"
        :data-word-id="pageWord.id"
        :data-is-active="pageWordActive == pageWord.id"
        :contenteditable="drawModeStore.mode == 'word'"
        :class="$style.pageWord"
        :style="{
          transform: `translate(${pageWord.rect.left}px, ${pageWord.rect.top}px)`,
          fontSize: `${pageWord.fontSize}px`,
          width: `${pageWord.rect.width}px`,
          height: `${pageWord.rect.height}px`,
          border: `${Math.max(1, 1 / canvasSizing.getCanvasScale())}px solid #000`
        }"
      >
        {{ pageWord.word }}
      </div>
    </div>
    <div :class="$style.pageNumber">
      {{ workPagesStore.nowPageIndex + 1 }} / {{ workPagesStore.pages.length }}
    </div>
    <div
      :class="$style.surface"
      :onpointerdown="onpointerdown"
      :onpointermove="onpointermove"
      :onpointerup="onpointerup"
      :onpointercancel="onpointerup"
      :onpointerout="onpointerup"
      :onpointerleave="onpointerup"
      :onmousemove="onmousemove"
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

.pageWord {
  background-color: #fff8;
  position: absolute;
  left: 0;
  top: 0;
  writing-mode: vertical-rl;
  outline: none;
  white-space: pre;
}
.pageWord:focus {
  border-color: #f00 !important;
}

.pageNumber {
  position: absolute;
  bottom: 2.5rem;
  right: 0.5rem;
  font-size: 4rem;
  color: #000;
}

.surface {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
