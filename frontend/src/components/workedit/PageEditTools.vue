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
const onClickWord = () => {
  drawModeStore.mode = 'word';
};
</script>

<template>
  <div :class="$style.tools">
    <button
      :onclick="onClickMove"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'move'"
    >
      move
    </button>
    <button
      :onclick="onClickPen"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'pen'"
    >
      pen
    </button>
    <button
      :onclick="onClickEraser"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'eraser'"
    >
      eraser
    </button>
    <button
      :onclick="onClickWord"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'word'"
    >
      word
    </button>
    <button :class="$style.tool">settings</button>
  </div>
</template>

<style module>
.tools {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100vw;
  display: flex;
  flex-direction: row;
}

.tool {
  flex-grow: 1;
  font-size: 2em;
  height: 1.8em;
  border: none;
  outline: none;
  padding: 0;
  border-top: 0.1rem solid #444;
}

.tool[dat-tool-active='true'] {
  background-color: #aef;
}
</style>
