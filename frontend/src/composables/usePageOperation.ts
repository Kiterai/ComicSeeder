import { useDrawState } from '@/stores/drawState';
import { useWorkPages } from '@/stores/workPages';
import { useWorks, type WorkData } from '@/stores/works';
import { computed, toRaw } from 'vue';

export const usePageOperation = () => {
  const worksStore = useWorks();
  const workPagesStore = useWorkPages();
  const drawState = useDrawState();

  const currentPageIndex = computed(() => {
    return drawState.currentPageIndex;
  });
  const currentWorkPagesNum = computed(() => {
    return drawState.currentWork.pageIds.length;
  });

  async function completePages() {
    while (currentWorkPagesNum.value <= drawState.currentPageIndex)
      drawState.currentWork.pageIds.push(await workPagesStore.addBlankPage());
    worksStore.updateWork(toRaw(drawState.currentWork));
  }
  async function loadCurrentIndexPage() {
    await workPagesStore.loadPage(drawState.currentWork.pageIds[drawState.currentPageIndex]);
  }

  let pageLoading = false;
  async function tryGotoPrevPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (drawState.currentPageIndex > 0) {
      await workPagesStore.saveCurrentPage();
      drawState.currentPageIndex--;
      await loadCurrentIndexPage();
    }
    pageLoading = false;
  }
  async function tryGotoNextPage() {
    if (pageLoading) return;
    pageLoading = true;
    await workPagesStore.saveCurrentPage();
    drawState.currentPageIndex++;
    await completePages();
    await loadCurrentIndexPage();
    pageLoading = false;
  }
  async function tryGotoPageByIndex(index: number) {
    if (drawState.currentPageIndex === index) return;
    if (pageLoading) return;
    pageLoading = true;
    await workPagesStore.saveCurrentPage();
    drawState.currentPageIndex = index;
    await completePages();
    await loadCurrentIndexPage();
    pageLoading = false;
  }
  async function tryDeleteNowPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (currentWorkPagesNum.value > 1) {
      drawState.currentWork.pageIds.splice(drawState.currentPageIndex, 1);
      drawState.currentPageIndex = Math.min(
        drawState.currentPageIndex,
        currentWorkPagesNum.value - 1
      );
      await loadCurrentIndexPage();
    }
    pageLoading = false;
  }
  async function setup() {
    await completePages();
    await loadCurrentIndexPage();
  }

  return {
    tryGotoPrevPage,
    tryGotoNextPage,
    tryDeleteNowPage,
    tryGotoPageByIndex,
    setup,
    currentWorkPagesNum,
    currentPageIndex
  };
};
