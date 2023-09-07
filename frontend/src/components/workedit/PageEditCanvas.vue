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

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function touchdist(p1: PointerEvent, p2: PointerEvent) {
  return dist(p1.clientX, p1.clientY, p2.clientX, p2.clientY);
}

type PointerData = {
  evfirst: PointerEvent;
  evlast: PointerEvent;
};

const fingertouches = new Map<number, PointerData>();
const pentouches = new Map<number, PointerData>();
let canvasScrollBaseX = 0;
let canvasScrollBaseY = 0;
let canvasZoomBaseScale = 1;
let canvasBaseTouch: Array<PointerEvent> | null = null;

function finger1setup() {
  canvasScrollBaseX = canvasCenterX.value;
  canvasScrollBaseY = canvasCenterY.value;
  canvasBaseTouch = Array.from(fingertouches).map((touch) => touch[1].evlast);
}

function finger2setup() {
  canvasScrollBaseX = canvasCenterX.value;
  canvasScrollBaseY = canvasCenterY.value;
  canvasZoomBaseScale = canvasScale.value;
  canvasBaseTouch = Array.from(fingertouches).map((touch) => touch[1].evlast);
}

const onfingerdown = (e: PointerEvent) => {
  fingertouches.set(e.pointerId, {
    evfirst: e,
    evlast: e
  });
  if (fingertouches.size == 1) {
    finger1setup();
  } else if (fingertouches.size == 2) {
    finger2setup();
  }
};
const onfingermove = (e: PointerEvent) => {
  const touch = fingertouches.get(e.pointerId);
  if (!touch) return;

  if (fingertouches.size == 1 && canvasBaseTouch) {
    canvasCenterX.value = canvasScrollBaseX + e.clientX - canvasBaseTouch[0].clientX;
    canvasCenterY.value = canvasScrollBaseY + e.clientY - canvasBaseTouch[0].clientY;
  } else if (fingertouches.size == 2 && canvasBaseTouch) {
    const touches = Array.from(fingertouches).map((touch) => touch[1].evlast);

    const scalediff =
      touchdist(touches[0], touches[1]) / touchdist(canvasBaseTouch[0], canvasBaseTouch[1]);
    const touchdiffX = [
      touches[0].clientX - canvasBaseTouch[0].clientX,
      touches[1].clientX - canvasBaseTouch[1].clientX
    ];
    const touchdiffY = [
      touches[0].clientY - canvasBaseTouch[0].clientY,
      touches[1].clientY - canvasBaseTouch[1].clientY
    ];
    canvasCenterX.value = canvasScrollBaseX + (touchdiffX[0] + touchdiffX[1]) / 2;
    canvasCenterY.value = canvasScrollBaseY + (touchdiffY[0] + touchdiffY[1]) / 2;
    canvasScale.value = canvasZoomBaseScale * scalediff;
  }

  touch.evlast = e;
};
const onfingerup = (e: PointerEvent) => {
  fingertouches.delete(e.pointerId);
  if (fingertouches.size == 1) {
    finger1setup();
  } else if (fingertouches.size == 2) {
    finger2setup();
  }
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
  touch-action: none;
}
</style>
