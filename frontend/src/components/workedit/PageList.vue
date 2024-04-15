<script setup lang="ts">
import { usePageOperation } from '@/composables/usePageOperation';
import { useDrawState } from '@/stores/drawState';
import IconBin from '../icons/IconBin.vue';
import IconPlus from '../icons/IconPlus.vue';
import IconTriangleLeft from '../icons/IconTriangleLeft.vue';
import IconTriangleRight from '../icons/IconTriangleRight.vue';
import IconChevronDown from '../icons/IconChevronDown.vue';
import IconChevronUp from '../icons/IconChevronUp.vue';
import { useWorkPages } from '@/stores/workPages';

const drawState = useDrawState();
const pageOperation = usePageOperation();
const workPages = useWorkPages();

const onSwitchOpened = () => {
  drawState.pageListPanelOpened = !drawState.pageListPanelOpened;
};
const onSelectPage = (e: MouseEvent) => {
  if (!(e.currentTarget instanceof HTMLElement)) return;
  const index = e.currentTarget.dataset.index;
  if (!index) return;
  pageOperation.tryGotoPageByIndex(Number(index));
};
</script>

<template>
  <div
    :class="$style.pagelist"
    :style="{
      flexDirection: drawState.currentWork.pageDirection == 'R2L' ? 'row-reverse' : 'row',
      top: drawState.pageListPanelOpened ? '0' : '-10rem',
      boxShadow: drawState.pageListPanelOpened ? '0 0 2rem #0008' : '0 0 2rem transparent'
    }"
  >
    <div
      v-for="(pageId, index) in drawState.currentWork.pageIds"
      :key="pageId"
      :class="$style.page"
      :data-current="index === drawState.currentPageIndex"
      :data-index="index"
      :onmousedown="onSelectPage"
    >
      <div :class="$style.pageIndex">{{ index + 1 }}</div>
      <img :class="$style.pageThumbnail" :src="workPages.pageThumbnail(pageId)" />
    </div>
  </div>
  <div
    :class="$style.buttonContainer"
    :style="{
      top: drawState.pageListPanelOpened ? '10rem' : '0'
    }"
  >
    <button :class="$style.button" :onpointerup="() => pageOperation.tryDeleteNowPage()">
      <IconBin />
    </button>
    <button :class="$style.button" :onmousedown="() => pageOperation.tryAddPage()"><IconPlus /></button>
    <button :class="$style.button" :onmousedown="() => pageOperation.tryGotoLeftPage()">
      <IconTriangleLeft />
    </button>
    <button :class="$style.button" :onmousedown="() => pageOperation.tryGotoRightPage()">
      <IconTriangleRight />
    </button>
    <button :class="[$style.button, $style.openButton]" :onmousedown="onSwitchOpened">
      <IconChevronDown v-if="!drawState.pageListPanelOpened" />
      <IconChevronUp v-else />
    </button>
  </div>
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
  justify-content: center;
}

.page {
  height: 8rem;
  margin: 1rem;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.page:hover {
  outline: #aaa solid 0.3rem;
}

.page[data-current='true'] {
  outline: #777 solid 0.3rem;
}

.pageIndex {
  position: absolute;
  left: 0;
  top: 0;
  padding: 0 0.3rem;
  background-color: #fff;
}

.pageThumbnail {
  max-width: 100%;
  max-height: 100%;
  background-color: #fff;
}

.buttonContainer {
  position: fixed;
  right: 0;
  transition: 0.1s ease top;
  display: flex;
}
.button {
  width: 3rem;
  height: 3rem;
  border-radius: 0 0 0.5rem 0.5rem;
  border: none;
  margin-left: 0.1rem;
  background-color: #ddd;
  transition: background-color 0.1s ease;
  cursor: pointer;
}
.button:hover {
  background-color: #bbb;
}
.openButton {
  margin-left: 0.5rem;
}
</style>
