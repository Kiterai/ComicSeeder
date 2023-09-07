<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

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

type PointerData = {
  evfirst: PointerEvent;
  evlast: PointerEvent;
};

const fingertouches = new Map<number, PointerData>();
const pentouches = new Map<number, PointerData>();
const canvasScrollBaseX = ref(0);
const canvasScrollBaseY = ref(0);

const onfingerdown = (e: PointerEvent) => {
  fingertouches.set(e.pointerId, {
    evfirst: e,
    evlast: e
  });
  if (fingertouches.size == 1) {
    canvasScrollBaseX.value = canvasCenterX.value;
    canvasScrollBaseY.value = canvasCenterY.value;
  }
};
const onfingermove = (e: PointerEvent) => {
  const touch = fingertouches.get(e.pointerId);
  if (!touch) return;

  if (fingertouches.size == 1) {
    canvasCenterX.value = canvasScrollBaseX.value + e.clientX - touch.evfirst.clientX;
    canvasCenterY.value = canvasScrollBaseY.value + e.clientY - touch.evfirst.clientY;
  } else if (fingertouches.size == 2) {
    Array.from(fingertouches);
  }

  touch.evlast = e;
};
const onfingerup = (e: PointerEvent) => {
  fingertouches.delete(e.pointerId);
};

const onpendown = (e: PointerEvent) => {
  pentouches.set(e.pointerId, {
    evfirst: e,
    evlast: e
  });
};
const onpenmove = (e: PointerEvent) => {
  const touch = pentouches.get(e.pointerId);
  if (!touch) return;

  touch.evlast = e;
};
const onpenup = (e: PointerEvent) => {
  pentouches.delete(e.pointerId);
};

const isFinger = (e: PointerEvent) => e.pointerType == 'touch';

const onpointerup = (e: PointerEvent) => {
  if (isFinger(e)) onfingerup(e);
  else onpenup(e);
};
const onpointermove = (e: PointerEvent) => {
  if (isFinger(e)) onfingermove(e);
  else onpenmove(e);
};
const onpointerdown = (e: PointerEvent) => {
  if (isFinger(e)) onfingerdown(e);
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
}
</style>
