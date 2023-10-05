import { useWorkPages } from '@/stores/workPages';
import { computed } from 'vue';

export const usePageOperation = () => {
  const workPagesStore = useWorkPages();

  let pageLoading = false;
  async function tryGotoPrevPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (workPagesStore.currentPageIndex > 0) {
      await workPagesStore.saveNowPage();
      workPagesStore.currentPageIndex--;
      await workPagesStore.loadNowPage();
    }
    pageLoading = false;
  }
  async function tryGotoNextPage() {
    if (pageLoading) return;
    pageLoading = true;
    await workPagesStore.saveNowPage();
    workPagesStore.currentPageIndex++;
    await workPagesStore.loadNowPage();
    pageLoading = false;
  }
  async function tryGotoPageByIndex(index: number) {
    if (workPagesStore.currentPageIndex === index) return;
    if (pageLoading) return;
    pageLoading = true;
    await workPagesStore.saveNowPage();
    workPagesStore.currentPageIndex = index;
    await workPagesStore.loadNowPage();
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
      await workPagesStore.loadNowPage();
    }
    pageLoading = false;
  }
  const currentWorkPagesNum = computed(() => {
    return workPagesStore.pages.length;
  });
  const currentPageIndex = computed(() => {
    return workPagesStore.currentPageIndex;
  });
  async function setup() {
    await workPagesStore.loadNowPage();
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
