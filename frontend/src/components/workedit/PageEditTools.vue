<script setup lang="ts">
import { useDrawMode } from '@/stores/drawMode';
import { useDrawState } from '@/stores/drawState';
import { useOpeHistory } from '@/stores/opeHistory';

const drawModeStore = useDrawMode();
const drawStateStore = useDrawState();
const opeHistory = useOpeHistory();

const onClickUndo = async () => {
  await opeHistory.tryUndo();
};
const onClickRedo = async () => {
  await opeHistory.tryRedo();
};
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
const onClickSettings = () => {
  drawStateStore.settingsPanelOpened = !drawStateStore.settingsPanelOpened;
};
</script>

<template>
  <div :class="$style.tools">
    <button :onclick="onClickUndo" :class="$style.tool">undo</button>
    <button :onclick="onClickRedo" :class="$style.tool">redo</button>
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
    <button :class="$style.tool" :onclick="onClickSettings">settings</button>
  </div>
</template>

<style module>
.tools {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100dvw;
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
