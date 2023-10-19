<script setup lang="ts">
import { useDrawMode } from '@/stores/drawMode';
import { useDrawState } from '@/stores/drawState';
import { useOpeHistory } from '@/stores/opeHistory';
import IconUndo from '../icons/IconUndo.vue';
import IconRedo from '../icons/IconRedo.vue';
import IconMove from '../icons/IconMove.vue';
import IconPencil from '../icons/IconPencil.vue';
import IconEraser from '../icons/IconEraser.vue';
import IconCog from '../icons/IconCog.vue';
import IconDocument from '../icons/IconDocument.vue';

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
    <button
      :onpointerup="onClickUndo"
      :class="$style.tool"
      :style="{
        color: opeHistory.isUndoAvailable() ? '#000' : '#aaa'
      }"
    >
      <IconUndo />
    </button>
    <button
      :onpointerup="onClickRedo"
      :class="$style.tool"
      :style="{
        color: opeHistory.isRedoAvailable() ? '#000' : '#aaa'
      }"
    >
      <IconRedo />
    </button>
    <button
      :onpointerup="onClickMove"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'move'"
    >
      <IconMove />
    </button>
    <button
      :onpointerup="onClickPen"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'pen'"
    >
      <IconPencil />
    </button>
    <button
      :onpointerup="onClickEraser"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'eraser'"
    >
      <IconEraser />
    </button>
    <button
      :onpointerup="onClickWord"
      :class="$style.tool"
      :dat-tool-active="drawModeStore.mode == 'word'"
    >
      <IconDocument />
    </button>
    <button :class="$style.tool" :onpointerup="onClickSettings">
      <IconCog />
    </button>
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.tool[dat-tool-active='true'] {
  background-color: #aef;
}
</style>
