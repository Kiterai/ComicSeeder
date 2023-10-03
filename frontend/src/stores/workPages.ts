import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Size = {
  width: number;
  height: number;
};

export type PageWord = {
  id: number;
  rect: Rect;
  word: string;
  fontSize: number;
};

export type PageData = {
  images: Array<Uint8Array>;
  words: Array<PageWord>;
  size: Size;
};

export const useWorkPages = defineStore('workPages', () => {
  const pages = ref<Array<PageData>>([]);
  const currentPageIndex = ref(0);
  const currentPage = computed(() => {
    return pages.value.at(currentPageIndex.value);
  });
  const currentPageWidth = computed(() => (currentPage.value ? currentPage.value.size.width : 1));
  const currentPageHeight = computed(() => (currentPage.value ? currentPage.value.size.height : 1));
  return { pages, currentPageIndex, currentPage, currentPageWidth, currentPageHeight };
});
