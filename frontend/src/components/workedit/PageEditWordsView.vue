<script setup lang="ts">
import { useCanvasSizing } from '@/stores/canvasSizing';
import { useDrawMode } from '@/stores/drawMode';
import { useWorkPages } from '@/stores/workPages';
import { computed } from 'vue';
import type { WordToolHandler } from './tools/WordToolHandler';

const prop = defineProps<{
  wordTool: WordToolHandler;
}>();

const wordHandleSize = computed(() => {
  return prop.wordTool.wordHandleSize();
});
const wordHandleBorderThickness = computed(() => {
  return prop.wordTool.wordHandleBorderThickness();
});
const lastSelectedWord = computed(() => {
  return prop.wordTool.lastSelectedWord.value;
});

const canvasSizing = useCanvasSizing();
const drawModeStore = useDrawMode();
const workPagesStore = useWorkPages();

const pageWords = computed(() =>
  workPagesStore.currentPage ? workPagesStore.currentPage.words : []
);
</script>

<template>
  <div
    :class="$style.pageWordContainer"
    :style="{
      ...canvasSizing.canvasStyle,
      position: 'absolute',
      zIndex: drawModeStore.mode === 'word' && wordTool.lastSelectedWord.value ? 1 : 0
    }"
    :onwheel="
      (e: WheelEvent) => {
        e.preventDefault();
      }
    "
  >
    <textarea
      v-for="(pageWord, index) in pageWords"
      :key="pageWord.id"
      :data-word-id="pageWord.id"
      :contenteditable="drawModeStore.mode == 'word'"
      spellcheck="false"
      :class="$style.pageWord"
      :style="{
        transform: `translate(${pageWord.rect.left}px, ${pageWord.rect.top}px)`,
        fontSize: `${pageWord.fontSize}px`,
        width: `${pageWord.rect.width}px`,
        height: `${pageWord.rect.height}px`,
        border: `${Math.max(1, 1 / canvasSizing.getCanvasScale())}px solid transparent`
      }"
      v-model="pageWords[index].word"
      :oninput="() => (workPagesStore.pageUpdated = true)"
    >
    </textarea>
  </div>
</template>

<style module>
.pageWord {
  background-color: transparent;
  position: absolute;
  left: 0;
  top: 0;
  writing-mode: vertical-rl;
  outline: none;
  white-space: pre;
  resize: none;
  overflow: hidden;
  cursor: auto;
}
.pageWord[contenteditable='true'] {
  border-color: #000 !important;
  background-color: #fff8;
}
.pageWord:focus {
  border-color: #f00 !important;
}
</style>
