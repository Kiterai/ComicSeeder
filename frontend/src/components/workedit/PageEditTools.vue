<script setup lang="ts">
import { useDrawMode } from '@/stores/drawMode';

const drawModeStore = useDrawMode();

const onClickMove = () => {
  drawModeStore.mode = 'move';
};
const onClickPen = () => {
  drawModeStore.mode = 'pen';
};
const onClickEraser = () => {
  drawModeStore.mode = 'eraser';
};
</script>

<template>
  <div :class="$style.tools">
    <button :onclick="onClickMove">move</button>
    <button :onclick="onClickPen">pen</button>
    <button :onclick="onClickEraser">eraser</button>
  </div>
</template>

<style module>
.tools {
  position: fixed;
  bottom: 0;
}
</style>
