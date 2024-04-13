<script setup lang="ts">
import { useCanvasSizing } from '@/stores/canvasSizing';
import { useDrawMode } from '@/stores/drawMode';
import { useWorkPages } from '@/stores/workPages';
import { computed, watch } from 'vue';
import type { WordToolHandler } from './tools/WordToolHandler';

const prop = defineProps<{
  wordTool: WordToolHandler;
}>();

const canvasSizing = useCanvasSizing();
const drawModeStore = useDrawMode();
const workPagesStore = useWorkPages();

const focusingWord = computed(() =>
  workPagesStore.currentPage.words.find((word) => word.id === prop.wordTool.focusingWordId.value)
);

const onInput = (e: InputEvent) => {
  workPagesStore.pageUpdated = true;
  if (!e.isComposing && e.target instanceof HTMLElement) {
    prop.wordTool.updateDraftInput(e.target.innerText);
  }
};
</script>

<template>
  <div
    v-if="drawModeStore.mode === 'word' && focusingWord"
    :class="$style.pageWordContainer"
    :style="canvasSizing.canvasStyle"
    :onwheel="
      (e: WheelEvent) => {
        e.preventDefault();
      }
    "
  >
    <div
      :data-word-id="focusingWord.id"
      :contenteditable="drawModeStore.mode == 'word'"
      spellcheck="false"
      :class="$style.pageWord"
      :style="{
        transform: `translate(${focusingWord.rect.left}px, ${focusingWord.rect.top}px)`,
        fontSize: `${focusingWord.fontSize}px`,
        width: `${focusingWord.rect.width}px`,
        height: `${focusingWord.rect.height}px`,
        border: `${Math.max(1, 1 / canvasSizing.getCanvasScale())}px solid transparent`
      }"
      v-text="focusingWord.word"
      :oninput="onInput"
    ></div>
  </div>
</template>

<style module>
.pageWord {
  font-family: 'Noto Serif JP', serif;
  background-color: #fff8;
  position: absolute;
  left: 0;
  top: 0;
  writing-mode: vertical-rl;
  outline: none;
  white-space: pre-wrap;
  resize: none;
  overflow: hidden;
  cursor: auto;
  border-color: #f00 !important;
}
</style>
