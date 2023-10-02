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
    workPagesStore.pages.length = Math.max(workPagesStore.pages.length, workPagesStore.nowPage + 1);
    workPagesStore.pages[workPagesStore.nowPage] = {
      images: [await getImgCompressed()],
      words: pageWords.value,
      size: {
        width: 1240,
        height: 1754
      }
    };
  }
  async function loadNowPage() {
    while (workPagesStore.pages.length <= workPagesStore.nowPage) {
      workPagesStore.pages.push({
        images: [],
        words: [],
        size: {
          width: 1240,   // A4, 150dpi
          height: 1754
        }
      });
    }
    const data = workPagesStore.pages[workPagesStore.nowPage];
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
    if (workPagesStore.nowPage > 0) {
      await saveNowPage();
      workPagesStore.nowPage--;
      await loadNowPage();
    }
    pageLoading = false;
  }
  async function tryGotoNextPage() {
    if (pageLoading) return;
    pageLoading = true;
    await saveNowPage();
    workPagesStore.nowPage++;
    await loadNowPage();
    pageLoading = false;
  }
  async function tryDeleteNowPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (workPagesStore.pages.length > 1) {
      workPagesStore.pages.splice(workPagesStore.nowPage, 1);
      workPagesStore.nowPage = Math.min(workPagesStore.nowPage, workPagesStore.pages.length - 1);
      await loadNowPage();
    }
    pageLoading = false;
  }
  loadNowPage();

  return { tryGotoPrevPage, tryGotoNextPage, tryDeleteNowPage };
};
