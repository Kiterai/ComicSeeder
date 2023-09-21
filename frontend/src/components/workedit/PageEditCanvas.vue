<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CanvasTouchGestureManager } from './CanvasTouchGestureManager';
import { useDrawMode } from '@/stores/drawMode';

// show implementation
const initialScale = 0.25;

function initView() {
  canvasCenterX.value = windowWidth.value / 2;
  canvasCenterY.value = windowHeight.value / 2;
  canvasScale.value = initialScale;
}

function onresize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
  initView();
}

function keydownViewChange(e: KeyboardEvent) {
  if (e.code == 'KeyF') initView();
}

onMounted(() => {
  window.addEventListener('resize', onresize);
  window.addEventListener('keydown', keydownViewChange);
});

onUnmounted(() => {
  window.removeEventListener('resize', onresize);
});

const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);
const canvasWidth = ref(1240);  // A4, 150dpi
const canvasHeight = ref(1754);

const canvasCenterX = ref(windowWidth.value / 2);
const canvasCenterY = ref(windowHeight.value / 2);
const canvasScale = ref(initialScale);

const canvasStyle = computed(() => {
  return {
    left: `${canvasCenterX.value + (-canvasWidth.value * canvasScale.value) / 2}px`,
    top: `${canvasCenterY.value + (-canvasHeight.value * canvasScale.value) / 2}px`,
    width: `${canvasWidth.value * canvasScale.value}px`,
    height: `${canvasHeight.value * canvasScale.value}px`
  };
});

const isFinger = (e: PointerEvent) => e.pointerType == 'touch';
const touchManager = new CanvasTouchGestureManager(canvasCenterX, canvasCenterY, canvasScale);
const wheelZoom = (e: WheelEvent) => {
  const minScale = 1 / 50;

  const deltaScale = 0.02;
  const beforeScale = canvasScale.value;
  const afterScale = Math.max(minScale, canvasScale.value * Math.exp(-e.deltaY * deltaScale));

  canvasCenterX.value = e.clientX + ((canvasCenterX.value - e.clientX) * afterScale) / beforeScale;
  canvasCenterY.value = e.clientY + ((canvasCenterY.value - e.clientY) * afterScale) / beforeScale;
  canvasScale.value = afterScale;
};
const wheelScroll = (e: WheelEvent) => {
  const deltaScale = 0.3;
  canvasCenterX.value -= e.deltaX * deltaScale;
  canvasCenterY.value -= e.deltaY * deltaScale;
};

function ClientToCanvas(cliX: number, cliY: number) {
  const x = canvasWidth.value / 2 + (cliX - canvasCenterX.value) / canvasScale.value;
  const y = canvasHeight.value / 2 + (cliY - canvasCenterY.value) / canvasScale.value;
  return { x, y };
}

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
const drawStroke = (ctx: CanvasRenderingContext2D, penHistory: Array<PenInput>) => {
  //
};

const eventToPenInput = (e: PointerEvent) => {
  const p = ClientToCanvas(e.clientX, e.clientY);
  return {
    x: p.x,
    y: p.y,
    pressure: e.pressure
  };
};

const drawModeStore = useDrawMode();

type ToolHandler = {
  up: (e: PointerEvent) => void;
  move: (e: PointerEvent) => void;
  down: (e: PointerEvent) => void;
};

const toolHandlers = {
  move: {
    up: (e: PointerEvent) => {
      touchManager.onfingerup(e);
    },
    move: (e: PointerEvent) => {
      touchManager.onfingermove(e);
    },
    down: (e: PointerEvent) => {
      touchManager.onfingerdown(e);
    }
  },
  pen: {
    up: (e: PointerEvent) => {
      const tmpctx = drawing!.tmpctx;
      const ctx = drawing!.ctx;
      tmpctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
      let tmpLastPenInput: PenInput | null = null;
      ctx.strokeStyle = '#888';
      ctx.lineCap = 'round';
      ctx.lineWidth = 10;
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
    },
    move: (e: PointerEvent) => {
      const newPenInput = eventToPenInput(e);
      const ctx = drawing!.tmpctx;
      ctx.strokeStyle = '#888';
      ctx.lineCap = 'round';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(lastPenInput!.x, lastPenInput!.y);
      ctx.lineTo(newPenInput!.x, newPenInput!.y);
      ctx.stroke();
      lastPenInput = newPenInput;
      penHistory.push(lastPenInput);
    },
    down: (e: PointerEvent) => {
      penHistory = [];
      lastPenInput = eventToPenInput(e);
      penHistory.push(lastPenInput);
    }
  },
  eraser: {
    up: (e: PointerEvent) => {},
    move: (e: PointerEvent) => {},
    down: (e: PointerEvent) => {}
  }
};

const penDownHandler = (e: PointerEvent) => {
  toolHandlers[drawModeStore.mode].down(e);
};
const penMoveHandler = (e: PointerEvent) => {
  toolHandlers[drawModeStore.mode].move(e);
};
const penUpHandler = (e: PointerEvent) => {
  toolHandlers[drawModeStore.mode].up(e);
};

const onpendown = (e: PointerEvent) => {
  if (!drawing) return;
  penHistory = [];
  penDownHandler(e);
};
const onpenmove = (e: PointerEvent) => {
  if (!drawing) return;
  if (e.pressure > 0) {
    penHistory.push(eventToPenInput(e));
    penMoveHandler(e);
  }
};
const onpenup = (e: PointerEvent) => {
  if (!drawing) return;
  penUpHandler(e);
};

// event handlers
const onpointerup = (e: PointerEvent) => {
  if (isFinger(e)) touchManager.onfingerup(e);
  else onpenup(e);
};
const onpointermove = (e: PointerEvent) => {
  if (isFinger(e)) touchManager.onfingermove(e);
  else onpenmove(e);
};
const onpointerdown = (e: PointerEvent) => {
  if (isFinger(e)) touchManager.onfingerdown(e);
  else onpendown(e);
};
const onwheel = (e: WheelEvent) => {
  if (e.ctrlKey) wheelZoom(e);
  else wheelScroll(e);
  e.preventDefault();
};
</script>

<template>
  <div :class="$style.canvasSystem">
    <canvas
      :style="canvasStyle"
      :class="$style.mainCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
      ref="mainCanvasRef"
    ></canvas>
    <canvas
      :style="canvasStyle"
      :class="$style.tmpCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
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
      :onwheel="onwheel"
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
