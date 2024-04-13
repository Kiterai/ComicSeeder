<script setup lang="ts">
import { useCanvasSizing } from '@/stores/canvasSizing';
import { useDrawMode } from '@/stores/drawMode';
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
const focusingWord = computed(() => {
  return prop.wordTool.focusingWord.value;
});

const canvasSizing = useCanvasSizing();
const drawModeStore = useDrawMode();
</script>

<template>
  <div :style="canvasSizing.canvasStyle">
    <div
      v-if="focusingWord && drawModeStore.mode == 'word'"
      :style="{
        width: `${wordHandleSize}px`,
        height: `${wordHandleSize}px`,
        backgroundColor: `#8FF`,
        transform: `translate(${focusingWord.rect.left + focusingWord.rect.width}px, ${
          focusingWord.rect.top - wordHandleSize
        }px)`,
        border: `${wordHandleBorderThickness}px solid #333`,
        position: 'absolute'
      }"
    ></div>
    <div
      v-if="focusingWord && drawModeStore.mode == 'word'"
      :style="{
        width: `${wordHandleSize}px`,
        height: `${wordHandleSize}px`,
        backgroundColor: `#8FF`,
        transform: `translate(${focusingWord.rect.left - wordHandleSize}px, ${
          focusingWord.rect.top + focusingWord.rect.height
        }px)`,
        border: `${wordHandleBorderThickness}px solid #333`,
        position: 'absolute'
      }"
    ></div>
  </div>
</template>

<style module></style>
