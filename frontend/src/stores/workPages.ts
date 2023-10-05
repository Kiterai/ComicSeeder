import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useCanvas } from './canvas';
import { getImgCompressed, getImgDecompressed } from '@/lib/imgCompress';

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
  const currentPage = computed<PageData | undefined>(() => {
    return pages.value.at(currentPageIndex.value);
  });
  const currentPageWidth = computed(() => (currentPage.value ? currentPage.value.size.width : 1));
  const currentPageHeight = computed(() => (currentPage.value ? currentPage.value.size.height : 1));

  const canvas = useCanvas();
  async function saveNowPage() {
    pages.value[currentPageIndex.value].images = [
      await getImgCompressed(canvas.getImage())
    ];
  }
  async function loadNowPage() {
    while (pages.value.length <= currentPageIndex.value) {
      pages.value.push({
        images: [],
        words: [],
        size: {
          width: 1240, // A4, 150dpi
          height: 1754
        }
      });
    }
    const data = pages.value[currentPageIndex.value];
    if (data.images.length > 0) {
      for (const rawImgData of data.images) {
        const imgData = new ImageData(
          await getImgDecompressed(rawImgData),
          currentPageWidth.value,
          currentPageHeight.value
        );

        canvas.clear();
        canvas.putImage(imgData);
      }
    } else {
      canvas.clear();
    }
  }

  return { pages, currentPageIndex, currentPage, currentPageWidth, currentPageHeight, saveNowPage, loadNowPage };
});
