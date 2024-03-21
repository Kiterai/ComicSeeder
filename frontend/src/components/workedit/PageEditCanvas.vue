<script setup lang="ts">
import { computed, onMounted, readonly, ref, toRaw, toValue } from 'vue';
import { useDrawMode, type DrawMode } from '@/stores/drawMode';
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
import { useDrawState } from '@/stores/drawState';
import PageEditWordsView from './PageEditWordsView.vue';
import IconBin from '../icons/IconBin.vue';
import PageEditWordHandlerView from './PageEditWordHandlerView.vue';
import PageEditActiveWordsView from './PageEditActiveWordsView.vue';

// show implementation
const canvasSizing = useCanvasSizing();
const isFinger = (e: PointerEvent) => e.pointerType == 'touch';

// drawing implementation
const tmpCanvasRef = ref(null);
const mainCanvasRef = ref(null);

const opeHistory = useOpeHistory();
const pageOperation = usePageOperation();
const drawState = useDrawState();

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

function onSelectPen(e: MouseEvent) {
  if (!(e.currentTarget instanceof HTMLElement)) return;
  drawState.penSettingIndex = Number(e.currentTarget.dataset.index);
}

function onSelectEraser(e: MouseEvent) {
  if (!(e.currentTarget instanceof HTMLElement)) return;
  drawState.eraserIndex = Number(e.currentTarget.dataset.index);
}

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
  wordTool.tryDeleteWord();
};

let tmpOldDrawMode: DrawMode | null = null;

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
      await pageOperation.tryGotoRightPage();
      canvasSizing.initView();
    }
    if (e.key == 'ArrowLeft') {
      await pageOperation.tryGotoLeftPage();
      canvasSizing.initView();
    }
    if (e.key == 'ArrowDown') {
      drawState.pageListPanelOpened = true;
    }
    if (e.key == 'ArrowUp') {
      drawState.pageListPanelOpened = false;
    }
    if (e.key == 'q') {
      drawState.pageListPanelOpened = !drawState.pageListPanelOpened;
    }
    if (e.key == 'D') {
      await pageOperation.tryDeleteNowPage();
      canvasSizing.initView();
    }
    if (e.key == 'A') {
      await pageOperation.tryAddPage();
      canvasSizing.initView();
    }
    if (e.key == 'v') {
      drawModeStore.mode = 'move';
    }
    if (e.key == 'b') {
      drawModeStore.mode = 'pen';
    }
    if (e.key == 'e') {
      drawModeStore.mode = 'eraser';
    }
    if (e.key == 'w') {
      drawModeStore.mode = 'word';
    }
    if (e.key == 'c') {
      drawState.settingsPanelOpened = !drawState.settingsPanelOpened;
    }
    if (e.key == 'f') {
      canvasSizing.initView();
    }
    if (e.key == ' ' && !e.repeat) {
      tmpOldDrawMode = drawModeStore.mode;
      drawModeStore.mode = 'move';
    }
  },
  async (e) => {
    if (e.key == ' ' && tmpOldDrawMode !== null) {
      drawModeStore.mode = tmpOldDrawMode;
      tmpOldDrawMode = null;
    }
  }
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
const penCancelHandler = (e: PointerEvent) => {
  toolHandler.cancel();
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
const onpencancel = (e: PointerEvent) => {
  if (!nowPenDown) return;
  penCancelHandler(e);
  nowPenDown = false;
};

// event handlers
let touchDeviceState: 'operate' | 'pinchmove' | null = null;
let touches = new Map<number, PointerEvent>();

const onpointerup = (e: PointerEvent) => {
  touches.delete(e.pointerId);
  if (drawState.deviceMode === 'pentouch') {
    if (isFinger(e)) canvasSizing.touchManager.onfingerup(e);
    else onpenup(e);
  } else if (drawState.deviceMode === 'touch') {
    if (touchDeviceState === 'operate') {
      onpenup(e);
    } else if (touchDeviceState === 'pinchmove') {
      canvasSizing.touchManager.onfingerup(e);
    }
    if (touches.size === 0) {
      touchDeviceState = null;
    }
  }
};
const onpointermove = (e: PointerEvent) => {
  touches.set(e.pointerId, e);
  if (drawState.deviceMode === 'pentouch') {
    if (isFinger(e)) canvasSizing.touchManager.onfingermove(e);
    else onpenmove(e);
  } else if (drawState.deviceMode === 'touch') {
    if (touchDeviceState === 'operate') {
      onpenmove(e);
    } else if (touchDeviceState === 'pinchmove') {
      canvasSizing.touchManager.onfingermove(e);
    }
  }
};
const onpointerdown = (e: PointerEvent) => {
  touches.set(e.pointerId, e);
  if (drawState.deviceMode === 'pentouch') {
    if (isFinger(e)) canvasSizing.touchManager.onfingerdown(e);
    else onpendown(e);
  } else if (drawState.deviceMode === 'touch') {
    if (touchDeviceState === null) {
      onpendown(e);
      touchDeviceState = 'operate';
    } else if (touchDeviceState === 'operate') {
      onpencancel(e);
      touches.forEach((val, key) => {
        canvasSizing.touchManager.onfingerdown(val);
      });
      touchDeviceState = 'pinchmove';
    } else if (touchDeviceState === 'pinchmove') {
      canvasSizing.touchManager.onfingerdown(e);
    }
  }
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
    <PageEditWordsView :word-tool="wordTool"></PageEditWordsView>
    <PageEditWordHandlerView :word-tool="wordTool"></PageEditWordHandlerView>
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
      :onwheel="canvasSizing.onwheel"
      :data-grabbable="drawModeStore.mode == 'move'"
    ></div>
    <PageEditActiveWordsView :word-tool="wordTool"></PageEditActiveWordsView>
    <div v-if="drawModeStore.mode == 'pen'" :class="$style.canvasUnderContainer">
      <div
        v-for="(penSetting, index) in drawState.penSettingList"
        :key="index"
        :class="$style.penSetting"
        :data-index="index"
        :data-current="drawState.penSettingIndex === index"
        :onpointerup="onSelectPen"
      >
        <div
          :style="{
            backgroundColor: penSetting.color,
            width: `${Math.min(4, penSetting.width * 0.05)}rem`,
            height: `${Math.min(4, penSetting.width * 0.05)}rem`,
            borderRadius: `2rem`
          }"
        ></div>
      </div>
    </div>
    <div v-if="drawModeStore.mode == 'eraser'" :class="$style.canvasUnderContainer">
      <div
        v-for="(eraserWidth, index) in drawState.eraserWidthList"
        :key="index"
        :class="$style.penSetting"
        :data-index="index"
        :data-current="drawState.eraserIndex === index"
        :onpointerup="onSelectEraser"
      >
        <div
          :style="{
            backgroundColor: '#fff',
            border: '0.1rem solid #000',
            width: `${Math.min(4, eraserWidth * 0.02)}rem`,
            height: `${Math.min(4, eraserWidth * 0.02)}rem`,
            borderRadius: `2rem`
          }"
        ></div>
      </div>
    </div>
    <div v-if="drawModeStore.mode == 'word'" :class="$style.canvasUnderContainer">
      <button
        v-if="wordTool.lastSelectedWordId.value !== null"
        :class="$style.pageWordDelButton"
        :onpointerup="tryDeleteWord"
      >
        <IconBin />
      </button>
      <input
        v-if="wordTool.lastSelectedWord.value !== undefined"
        type="number"
        step="0.5"
        v-model="wordTool.lastSelectedWord.value.fontSize"
        :class="$style.pageWordFontSizeInput"
      />
    </div>
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

.canvasUnderContainer {
  position: fixed;
  bottom: 4rem;
  left: 1rem;
  display: flex;
}

.penSetting {
  width: 4rem;
  height: 4rem;
  border-radius: 2rem;
  margin: 0.3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  outline: 0.1rem solid #ccc;
  cursor: pointer;
}
.penSetting:hover {
  outline: 0.2rem solid #666;
}
.penSetting[data-current='true'] {
  outline: 0.2rem solid #000;
}

.pageWordFontSizeInput {
  width: 7rem;
  font-size: 2rem;
  margin-left: 1rem;
  border-radius: 1rem;
  padding: 0.5rem;
  border: 0.2rem solid #000;
}

.pageWordDelButton {
  background-color: #f44;
  color: #fff;
  width: 5rem;
  height: 5rem;
  border: 0.2rem solid #000;
  outline: none;
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
}
.surface[data-grabbable='true'] {
  cursor: grab;
}
</style>
