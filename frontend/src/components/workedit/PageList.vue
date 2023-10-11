<script setup lang="ts">
import { usePageOperation } from '@/composables/usePageOperation';
import { useDrawState } from '@/stores/drawState';
import { ref } from 'vue';

const drawState = useDrawState();
const pageOperation = usePageOperation();

const opened = ref(false);

const onSwitchOpened = () => {
  opened.value = !opened.value;
};
const onSelectPage = (e: MouseEvent) => {
  if (!(e.target instanceof HTMLElement)) return;
  const index = e.target.dataset.index;
  if (!index) return;
  pageOperation.tryGotoPageByIndex(Number(index));
};
</script>

<template>
  <div
    :class="$style.pagelist"
    :style="{
      flexDirection: drawState.currentWork.pageDirection == 'R2L' ? 'row-reverse' : 'row',
      top: opened ? '0' : '-10rem',
      boxShadow: opened ? '0 0 2rem #0008' : '0 0 2rem transparent'
    }"
  >
    <div
      v-for="(pageId, index) in drawState.currentWork.pageIds"
      :key="pageId"
      :class="$style.page"
      :data-current="index === drawState.currentPageIndex"
      :data-index="index"
      :onclick="onSelectPage"
    >
      {{ index + 1 }}
    </div>
  </div>
  <button
    :class="$style.openButton"
    :onclick="onSwitchOpened"
    :style="{
      top: opened ? '10rem' : '0'
    }"
  >
    Open
  </button>
</template>

<style module>
.pagelist {
  position: fixed;
  height: 10rem;
  background-color: #ddd;
  width: 100dvw;
  display: flex;
  overflow-x: scroll;
  overscroll-behavior-x: none;
  transition:
    0.1s ease top,
    0.1s ease box-shadow;
}

.page {
  height: 8rem;
  width: 7rem;
  background-color: #fff;
  margin: 1rem;
  flex-shrink: 0;
}

.page:hover {
  outline: #aaa solid 0.3rem;
}

.page[data-current='true'] {
  outline: #777 solid 0.3rem;
}

.openButton {
  position: fixed;
  right: 0;
  width: 5rem;
  height: 3rem;
  border-radius: 0 0 1rem 1rem;
  border: none;
  transition: 0.1s ease top;
}
</style>
