<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CanvasTouchGestureManager } from './CanvasTouchGestureManager';

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
const canvasWidth = ref(2000);
const canvasHeight = ref(2000);

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

  const beforeScale = canvasScale.value;
  const afterScale = Math.max(minScale, canvasScale.value - e.deltaY * 0.01);

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

const onpendown = (e: PointerEvent) => {
  if (!drawing) return;
};
const onpenmove = (e: PointerEvent) => {
  if (!drawing) return;
  if (e.pressure > 0) {
    const p = ClientToCanvas(e.clientX, e.clientY);
    drawing.tmpctx.beginPath();
    drawing.tmpctx.arc(p.x, p.y, e.pressure * 20, 0, 2 * Math.PI);
    drawing.tmpctx.fill();
  }
};
const onpenup = (e: PointerEvent) => {
  if (!drawing) return;
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
