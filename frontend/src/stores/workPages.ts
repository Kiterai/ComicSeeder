import { ref } from 'vue';
import { defineStore } from 'pinia';

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PageWord = {
  rect: Rect;
  word: string;
  fontSize: number;
};

export type PageData = {
  images: Array<Uint8Array>;
  words: Array<PageWord>;
};

export const useWorkPages = defineStore('workPages', () => {
  const pages = ref<Array<PageData>>([]);
  const nowPage = ref(0);
  return { pages, nowPage };
});
