import { useWorkPages, type PageWord } from '@/stores/workPages';
import type { useCanvasSizing } from './useCanvasSizing';
import type { Ref } from 'vue';
import { useCanvas } from '@/stores/canvas';
import { getImgCompressed, getImgDecompressed } from '@/lib/imgCompress';

export const usePageOperation = (
  applyWordChanges: () => void,
  canvasSizing: ReturnType<typeof useCanvasSizing>,
  pageWords: Ref<Array<PageWord>>
) => {
  const workPagesStore = useWorkPages();
  const canvas = useCanvas();

  async function saveNowPage() {
    applyWordChanges();
    workPagesStore.pages.length = Math.max(
      workPagesStore.pages.length,
      workPagesStore.nowPageIndex + 1
    );
    workPagesStore.pages[workPagesStore.nowPageIndex] = {
      images: [await getImgCompressed(canvas.getImage())],
      words: pageWords.value,
      size: {
        width: 1240,
        height: 1754
      }
    };
  }
  async function loadNowPage() {
    while (workPagesStore.pages.length <= workPagesStore.nowPageIndex) {
      workPagesStore.pages.push({
        images: [],
        words: [],
        size: {
          width: 1240, // A4, 150dpi
          height: 1754
        }
      });
    }
    const data = workPagesStore.pages[workPagesStore.nowPageIndex];
    if (data.images.length > 0) {
      for (const rawImgData of data.images) {
        const imgData = new ImageData(
          await getImgDecompressed(rawImgData),
          canvasSizing.canvasWidth.value,
          canvasSizing.canvasHeight.value
        );

        canvas.clear();
        canvas.putImage(imgData);
      }
    } else {
      canvas.clear();
    }
    pageWords.value = data.words;
    canvasSizing.initView();
  }
  let pageLoading = false;
  async function tryGotoPrevPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (workPagesStore.nowPageIndex > 0) {
      await saveNowPage();
      workPagesStore.nowPageIndex--;
      await loadNowPage();
    }
    pageLoading = false;
  }
  async function tryGotoNextPage() {
    if (pageLoading) return;
    pageLoading = true;
    await saveNowPage();
    workPagesStore.nowPageIndex++;
    await loadNowPage();
    pageLoading = false;
  }
  async function tryDeleteNowPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (workPagesStore.pages.length > 1) {
      workPagesStore.pages.splice(workPagesStore.nowPageIndex, 1);
      workPagesStore.nowPageIndex = Math.min(
        workPagesStore.nowPageIndex,
        workPagesStore.pages.length - 1
      );
      await loadNowPage();
    }
    pageLoading = false;
  }
  loadNowPage();

  return { tryGotoPrevPage, tryGotoNextPage, tryDeleteNowPage };
};
