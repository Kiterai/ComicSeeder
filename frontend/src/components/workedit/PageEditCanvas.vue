<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CanvasTouchGestureManager } from './CanvasTouchGestureManager';

const initialScale = 0.25;

function onresize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
  canvasCenterX.value = 0;
  canvasCenterY.value = 0;
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

const canvasCenterX = ref(0);
const canvasCenterY = ref(0);
const canvasScale = ref(initialScale);

const canvasStyle = computed(() => {
  return {
    left: `${
      canvasCenterX.value + (windowWidth.value - canvasWidth.value * canvasScale.value) / 2
    }px`,
    top: `${
      canvasCenterY.value + (windowHeight.value - canvasHeight.value * canvasScale.value) / 2
    }px`,
    width: `${canvasWidth.value * canvasScale.value}px`,
    height: `${canvasHeight.value * canvasScale.value}px`
  };
});

const touchManager = new CanvasTouchGestureManager(canvasCenterX, canvasCenterY, canvasScale);

const onpendown = (e: PointerEvent) => {};
const onpenmove = (e: PointerEvent) => {};
const onpenup = (e: PointerEvent) => {};

const isFinger = (e: PointerEvent) => e.pointerType == 'touch';

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
</script>

<template>
  <div :class="$style.canvasSystem">
    <canvas :style="canvasStyle" :class="$style.tmpCanvas"></canvas>
    <canvas :style="canvasStyle" :class="$style.mainCanvas"></canvas>
    <div
      :class="$style.surface"
      :onpointerdown="onpointerdown"
      :onpointermove="onpointermove"
      :onpointerup="onpointerup"
      :onpointercancel="onpointerup"
      :onpointerout="onpointerup"
      :onpointerleave="onpointerup"
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
