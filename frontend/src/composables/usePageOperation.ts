import { useWorkPages } from '@/stores/workPages';
import { useCanvas } from '@/stores/canvas';
import { getImgCompressed, getImgDecompressed } from '@/lib/imgCompress';

export const usePageOperation = () => {
  const workPagesStore = useWorkPages();
  const canvas = useCanvas();

  async function saveNowPage() {
    workPagesStore.pages[workPagesStore.currentPageIndex].images = [
      await getImgCompressed(canvas.getImage())
    ];
  }
  async function loadNowPage() {
    while (workPagesStore.pages.length <= workPagesStore.currentPageIndex) {
      workPagesStore.pages.push({
        images: [],
        words: [],
        size: {
          width: 1240, // A4, 150dpi
          height: 1754
        }
      });
    }
    const data = workPagesStore.pages[workPagesStore.currentPageIndex];
    if (data.images.length > 0) {
      for (const rawImgData of data.images) {
        const imgData = new ImageData(
          await getImgDecompressed(rawImgData),
          workPagesStore.currentPageWidth,
          workPagesStore.currentPageHeight
        );

        canvas.clear();
        canvas.putImage(imgData);
      }
    } else {
      canvas.clear();
    }
  }
  let pageLoading = false;
  async function tryGotoPrevPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (workPagesStore.currentPageIndex > 0) {
      await saveNowPage();
      workPagesStore.currentPageIndex--;
      await loadNowPage();
    }
    pageLoading = false;
  }
  async function tryGotoNextPage() {
    if (pageLoading) return;
    pageLoading = true;
    await saveNowPage();
    workPagesStore.currentPageIndex++;
    await loadNowPage();
    pageLoading = false;
  }
  async function tryGotoPageByIndex(index: number) {
    if (workPagesStore.currentPageIndex === index) return;
    if (pageLoading) return;
    pageLoading = true;
    await saveNowPage();
    workPagesStore.currentPageIndex = index;
    await loadNowPage();
    pageLoading = false;
  }
  async function tryDeleteNowPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (workPagesStore.pages.length > 1) {
      workPagesStore.pages.splice(workPagesStore.currentPageIndex, 1);
      workPagesStore.currentPageIndex = Math.min(
        workPagesStore.currentPageIndex,
        workPagesStore.pages.length - 1
      );
      await loadNowPage();
    }
    pageLoading = false;
  }
  async function setup() {
    await loadNowPage();
  }

  return { tryGotoPrevPage, tryGotoNextPage, tryDeleteNowPage, tryGotoPageByIndex, setup };
};
