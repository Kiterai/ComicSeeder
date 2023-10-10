<script setup lang="ts">
import { useCanvasSizing } from '@/stores/canvasSizing';
import { useDrawMode } from '@/stores/drawMode';
import { useWorkPages } from '@/stores/workPages';
import { computed } from 'vue';
import type { WordToolHandler } from './tools/WordToolHandler';

defineProps<{
  wordToolHandler: WordToolHandler;
}>();

const canvasSizing = useCanvasSizing();
const drawModeStore = useDrawMode();
const workPagesStore = useWorkPages();

const pageWords = computed(() =>
  workPagesStore.currentPage ? workPagesStore.currentPage.words : []
);
</script>

<template>
  <div :style="canvasSizing.canvasStyle" :class="$style.pageWordContainer">
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
    >
    </textarea>
    <div
      v-if="wordToolHandler.lastSelectedWord.value && drawModeStore.mode == 'word'"
      :style="{
        width: `${wordToolHandler.wordHandleSize()}px`,
        height: `${wordToolHandler.wordHandleSize()}px`,
        backgroundColor: `#8FF`,
        transform: `translate(${
          wordToolHandler.lastSelectedWord.value.rect.left +
          wordToolHandler.lastSelectedWord.value.rect.width
        }px, ${
          wordToolHandler.lastSelectedWord.value.rect.top - wordToolHandler.wordHandleSize()
        }px)`,
        border: `${wordToolHandler.wordHandleBorderThickness()}px solid #333`,
        position: 'absolute'
      }"
    ></div>
    <div
      v-if="wordToolHandler.lastSelectedWord.value && drawModeStore.mode == 'word'"
      :style="{
        width: `${wordToolHandler.wordHandleSize()}px`,
        height: `${wordToolHandler.wordHandleSize()}px`,
        backgroundColor: `#8FF`,
        transform: `translate(${
          wordToolHandler.lastSelectedWord.value.rect.left - wordToolHandler.wordHandleSize()
        }px, ${
          wordToolHandler.lastSelectedWord.value.rect.top +
          wordToolHandler.lastSelectedWord.value.rect.height
        }px)`,
        border: `${wordToolHandler.wordHandleBorderThickness()}px solid #333`,
        position: 'absolute'
      }"
    ></div>
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
}
.pageWord[contenteditable='true'] {
  border-color: #000 !important;
  background-color: #fff8;
}
.pageWord:focus {
  border-color: #f00 !important;
}
</style>
