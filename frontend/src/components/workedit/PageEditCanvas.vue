<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CanvasTouchGestureManager } from './CanvasTouchGestureManager';

// show implementation
const initialScale = 0.25;

function onresize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
  canvasCenterX.value = windowWidth.value / 2;
  canvasCenterY.value = windowHeight.value / 2;
  canvasScale.value = initialScale;
}

onMounted(() => {
  window.addEventListener('resize', onresize);
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

// drawing implementation
const tmpCanvasRef = ref(null);
const mainCanvasRef = ref(null);

onMounted(() => {
  const tmpCanvas = tmpCanvasRef.value as any;
  const mainCanvas = mainCanvasRef.value as any;
  if (!(tmpCanvas instanceof HTMLCanvasElement)) return;
  if (!(mainCanvas instanceof HTMLCanvasElement)) return;

  tmpCanvas.getContext('2d');
});

const onpendown = (e: PointerEvent) => {};
const onpenmove = (e: PointerEvent) => {};
const onpenup = (e: PointerEvent) => {};

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
  wheelZoom(e);
  e.preventDefault();
};
</script>

<template>
  <div :class="$style.canvasSystem">
    <canvas
      :style="canvasStyle"
      :class="$style.tmpCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
      ref="tmpCanvas"
    ></canvas>
    <canvas
      :style="canvasStyle"
      :class="$style.mainCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
      ref="mainCanvas"
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
