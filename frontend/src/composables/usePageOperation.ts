import { useWorkPages, type PageWord } from '@/stores/workPages';
import type { useCanvasSizing } from './useCanvasSizing';
import type { Ref } from 'vue';

export const usePageOperation = (
  ctx: CanvasRenderingContext2D,
  applyWordChanges: () => void,
  getImgCompressed: () => Promise<Uint8Array>,
  getImgDecompressed: (data: Uint8Array) => Promise<Uint8ClampedArray>,
  canvasSizing: ReturnType<typeof useCanvasSizing>,
  pageWords: Ref<Array<PageWord>>
) => {
  const workPagesStore = useWorkPages();
  async function saveNowPage() {
    applyWordChanges();
    workPagesStore.pages.length = Math.max(workPagesStore.pages.length, workPagesStore.nowPageIndex + 1);
    workPagesStore.pages[workPagesStore.nowPageIndex] = {
      images: [await getImgCompressed()],
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
          width: 1240,   // A4, 150dpi
          height: 1754
        }
      });
    }
    const data = workPagesStore.pages[workPagesStore.nowPageIndex];
    if (data) {
      for (const rawImgData of data.images) {
        const imgData = new ImageData(
          await getImgDecompressed(rawImgData),
          canvasSizing.canvasWidth.value,
          canvasSizing.canvasHeight.value
        );
        ctx.clearRect(0, 0, canvasSizing.canvasWidth.value, canvasSizing.canvasHeight.value);
        ctx.putImageData(imgData, 0, 0);
      }
    } else {
      ctx.clearRect(0, 0, canvasSizing.canvasWidth.value, canvasSizing.canvasHeight.value);
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
      workPagesStore.nowPageIndex = Math.min(workPagesStore.nowPageIndex, workPagesStore.pages.length - 1);
      await loadNowPage();
    }
    pageLoading = false;
  }
  loadNowPage();

  return { tryGotoPrevPage, tryGotoNextPage, tryDeleteNowPage };
};
