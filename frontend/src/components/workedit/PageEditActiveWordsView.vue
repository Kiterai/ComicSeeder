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

const lastSelectedWord = computed(() =>
  workPagesStore.currentPage.words.find(
    (word) => word.id === prop.wordTool.lastSelectedWordId.value
  )
);

let updatedText: string | null = null;

const onInput = (e: InputEvent) => {
  workPagesStore.pageUpdated = true;
  if (!e.isComposing && e.target instanceof HTMLElement) {
    updatedText = e.target.innerText;
    console.log(updatedText)
  }
};

watch(lastSelectedWord, (newState, oldState) => {
  if (!newState && updatedText && oldState) {
    oldState.word = updatedText;
  }
});
</script>

<template>
  <div
    v-if="drawModeStore.mode === 'word' && lastSelectedWord"
    :class="$style.pageWordContainer"
    :style="canvasSizing.canvasStyle"
    :onwheel="
      (e: WheelEvent) => {
        e.preventDefault();
      }
    "
  >
    <div
      :data-word-id="lastSelectedWord.id"
      :contenteditable="drawModeStore.mode == 'word'"
      spellcheck="false"
      :class="$style.pageWord"
      :style="{
        transform: `translate(${lastSelectedWord.rect.left}px, ${lastSelectedWord.rect.top}px)`,
        fontSize: `${lastSelectedWord.fontSize}px`,
        width: `${lastSelectedWord.rect.width}px`,
        height: `${lastSelectedWord.rect.height}px`,
        border: `${Math.max(1, 1 / canvasSizing.getCanvasScale())}px solid transparent`
      }"
      v-text="lastSelectedWord.word"
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
