<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDrawMode } from '@/stores/drawMode';
import { useCanvas } from '@/stores/canvas';
import { useCanvasSizing } from '@/composables/useCanvasSizing';
import { useKeyboard } from '@/composables/useKeyboard';
import { useOpeHistory } from '@/stores/opeHistory';
import { useWorkPages } from '@/stores/workPages';
import { usePageOperation } from '@/composables/usePageOperation';
import { MoveToolHandler } from './tools/MoveToolHandler';
import { PenToolHandler } from './tools/PenToolHandler';
import { EraserToolHandler } from './tools/EraserToolHandler';
import { WordToolHandler } from './tools/WordToolHandler';

// show implementation
const canvasSizing = useCanvasSizing();
const isFinger = (e: PointerEvent) => e.pointerType == 'touch';

// drawing implementation
const tmpCanvasRef = ref(null);
const mainCanvasRef = ref(null);

const opeHistory = useOpeHistory();
const pageOperation = usePageOperation(applyWordChanges);

const canvas = useCanvas();

onMounted(() => {
  const tmpCanvas = tmpCanvasRef.value as any;
  const mainCanvas = mainCanvasRef.value as any;
  if (!(tmpCanvas instanceof HTMLCanvasElement)) return;
  if (!(mainCanvas instanceof HTMLCanvasElement)) return;

  canvas.setup(mainCanvas, tmpCanvas);
  pageOperation.setup();
});

const drawModeStore = useDrawMode();
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

const isTextEditing = () => {
  if (!document.activeElement) return false;
  if (!(document.activeElement instanceof HTMLElement)) return false;
  return document.activeElement.isContentEditable;
};

useKeyboard(
  async (e) => {
    if (e.ctrlKey && e.key == 'z') {
      if (isTextEditing()) return;
      opeHistory.tryUndo();
    }
    if (e.ctrlKey && e.key == 'y') {
      if (isTextEditing()) return;
      opeHistory.tryRedo();
    }
    if (e.key == 'ArrowRight') {
      await pageOperation.tryGotoNextPage();
      canvasSizing.initView();
    }
    if (e.key == 'ArrowLeft') {
      await pageOperation.tryGotoPrevPage();
      canvasSizing.initView();
    }
    if (e.key == 'D') {
      await pageOperation.tryDeleteNowPage();
      canvasSizing.initView();
    }
  },
  () => {}
);

const pageWords = computed(() =>
  workPagesStore.currentPage ? workPagesStore.currentPage.words : []
);

const toolHandlers = {
  move: new MoveToolHandler(canvasSizing.touchManager),
  pen: new PenToolHandler(canvasSizing),
  eraser: new EraserToolHandler(canvasSizing),
  word: new WordToolHandler(canvasSizing, getWordElem, applyWordChanges)
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
      {{ workPagesStore.currentPageIndex + 1 }} / {{ workPagesStore.pages.length }}
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
