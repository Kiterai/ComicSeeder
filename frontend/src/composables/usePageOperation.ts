import { useDrawState } from '@/stores/drawState';
import { useWorkPages } from '@/stores/workPages';
import { useWorks } from '@/stores/works';
import { computed, ref, toRaw } from 'vue';

export const usePageOperation = () => {
  const worksStore = useWorks();
  const workPagesStore = useWorkPages();
  const drawState = useDrawState();

  const currentWork = computed(() => {
    return worksStore.works[0]; // TODO
  });
  const currentPageIndex = computed(() => {
    return drawState.currentPageIndex;
  });
  const currentWorkPagesNum = computed(() => {
    return currentWork.value.pageIds.length;
  });

  async function completePages() {
    while (currentWorkPagesNum.value <= drawState.currentPageIndex)
      currentWork.value.pageIds.push(await workPagesStore.addBlankPage());
    worksStore.updateWork(toRaw(currentWork.value));
  }
  async function loadCurrentIndexPage() {
    await workPagesStore.loadPage(currentWork.value.pageIds[drawState.currentPageIndex]);
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
      currentWork.value.pageIds.splice(drawState.currentPageIndex, 1);
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
