<script setup lang="ts">
import { computed, onMounted, readonly, ref } from 'vue';
import { useDrawMode } from '@/stores/drawMode';
import { useCanvas } from '@/stores/canvas';
import { useCanvasSizing } from '@/stores/canvasSizing';
import { useKeyboard } from '@/composables/useKeyboard';
import { useOpeHistory } from '@/stores/opeHistory';
import { useWorkPages } from '@/stores/workPages';
import { usePageOperation } from '@/composables/usePageOperation';
import { MoveToolHandler } from './tools/MoveToolHandler';
import { PenToolHandler } from './tools/PenToolHandler';
import { EraserToolHandler } from './tools/EraserToolHandler';
import { WordToolHandler } from './tools/WordToolHandler';
import { useWorks, type WorkData } from '@/stores/works';
import { useDrawState } from '@/stores/drawState';
import PageEditWordsView from './PageEditWordsView.vue';

// show implementation
const canvasSizing = useCanvasSizing();
const isFinger = (e: PointerEvent) => e.pointerType == 'touch';

// drawing implementation
const tmpCanvasRef = ref(null);
const mainCanvasRef = ref(null);

const opeHistory = useOpeHistory();
const pageOperation = usePageOperation();
const worksStore = useWorks();
const drawState = useDrawState();

const currentWork = computed(() => {
  const dummy: WorkData = {
    id: '',
    title: 'dummy',
    pageIds: [],
    pageDirection: 'R2L',
    createdAt: '',
    updatedAt: ''
  };
  if (!drawState.currentWorkId) return dummy;
  const tmp = worksStore.works.find((work) => work.id === drawState.currentWorkId);
  if (!tmp) throw new Error(`invalid work id: ${drawState.currentWorkId}`);
  return tmp;
});

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

const isInputEditing = () => {
  if (!document.activeElement) return false;
  if (!(document.activeElement instanceof HTMLElement)) return false;
  if (document.activeElement instanceof HTMLInputElement) return true;
  if (document.activeElement instanceof HTMLSelectElement) return true;
  if (document.activeElement instanceof HTMLTextAreaElement) return true;
  return document.activeElement.isContentEditable;
};

const tryDeleteWord = () => {
  const targetId = wordTool.lastSelectedWordId.value;
  const index = pageWords.value.findIndex((word) => word.id === targetId);
  if (index !== -1) {
    opeHistory.beginOperation();
    const word = pageWords.value[index];
    pageWords.value.splice(index, 1);
    opeHistory.commitOperation({
      redo: async () => {
        const index = pageWords.value.findIndex((word) => word.id === targetId);
        if (index !== -1) pageWords.value.splice(index, 1);
      },
      undo: async () => {
        pageWords.value.push(word);
      }
    });
  }
};

useKeyboard(
  async (e) => {
    if (isInputEditing()) return;
    if (e.ctrlKey && e.key == 'z') {
      opeHistory.tryUndo();
    }
    if (e.ctrlKey && e.key == 'y') {
      opeHistory.tryRedo();
    }
    if (e.key == 'ArrowRight') {
      if (currentWork.value.pageDirection === 'L2R') await pageOperation.tryGotoNextPage();
      else if (currentWork.value.pageDirection === 'R2L') await pageOperation.tryGotoPrevPage();
      canvasSizing.initView();
    }
    if (e.key == 'ArrowLeft') {
      if (currentWork.value.pageDirection === 'L2R') await pageOperation.tryGotoPrevPage();
      else if (currentWork.value.pageDirection === 'R2L') await pageOperation.tryGotoNextPage();
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

const wordTool = new WordToolHandler(getWordElem);

const toolHandlers = {
  move: new MoveToolHandler(),
  pen: new PenToolHandler(),
  eraser: new EraserToolHandler(),
  word: wordTool
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
      :style="canvasSizing.canvasStyle"
      :class="$style.mainCanvas"
      :width="canvasSizing.canvasWidth"
      :height="canvasSizing.canvasHeight"
      ref="mainCanvasRef"
    ></canvas>
    <canvas
      :style="canvasSizing.canvasStyle"
      :class="$style.tmpCanvas"
      :width="canvasSizing.canvasWidth"
      :height="canvasSizing.canvasHeight"
      ref="tmpCanvasRef"
    ></canvas>
    <PageEditWordsView :word-tool-handler="wordTool"></PageEditWordsView>
    <div :class="$style.pageNumber">
      {{ pageOperation.currentPageIndex.value + 1 }} / {{ pageOperation.currentWorkPagesNum.value }}
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
    <button
      v-if="drawModeStore.mode == 'word'"
      :class="$style.pageWordDelButton"
      :onclick="tryDeleteWord"
    >
      削除
    </button>
  </div>
</template>

<style module>
.canvasSystem {
  height: 100dvh;
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
  background-color: transparent;
  position: absolute;
  left: 0;
  top: 0;
  writing-mode: vertical-rl;
  outline: none;
  white-space: pre;
  resize: none;
  overflow: hidden;
}
.pageWord[contenteditable='true'] {
  border-color: #000 !important;
  background-color: #fff8;
}
.pageWord:focus {
  border-color: #f00 !important;
}

.pageWordDelButton {
  background-color: #f44;
  color: #fff;
  width: 5rem;
  height: 5rem;
  border: 0.2rem solid #000;
  outline: none;
  position: fixed;
  bottom: 4rem;
  left: 1rem;
  border-radius: 1rem;
  font-size: 1.5rem;
  cursor: pointer;
}
.pageWordDelButton:hover {
  background-color: #c44;
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
  width: 100dvw;
  height: 100dvh;
  top: 0;
  touch-action: none;
}
</style>
