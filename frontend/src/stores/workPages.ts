import { ref } from 'vue';
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
  const nowPageIndex = ref(0);
  return { pages, nowPageIndex: nowPageIndex };
});
