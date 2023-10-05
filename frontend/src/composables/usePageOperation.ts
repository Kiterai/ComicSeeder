import { useWorkPages } from '@/stores/workPages';
import { useWorks } from '@/stores/works';
import { computed, ref } from 'vue';

export const usePageOperation = () => {
  const worksStore = useWorks();
  const workPagesStore = useWorkPages();

  const currentPageIndex = ref(0);
  const currentWork = computed(() => {
    return worksStore.works[0];   // TODO
  });
  const currentWorkPagesNum = computed(() => {
    return currentWork.value.pageIds.length;
  });

  async function completePages() {
    while (currentWorkPagesNum.value <= currentPageIndex.value)
      currentWork.value.pageIds.push(await workPagesStore.addBlankPage());
  }
  async function loadCurrentIndexPage() {
    await workPagesStore.loadPage(currentWork.value.pageIds[currentPageIndex.value]);
  }

  let pageLoading = false;
  async function tryGotoPrevPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (currentPageIndex.value > 0) {
      await workPagesStore.saveCurrentPage();
      currentPageIndex.value--;
      await loadCurrentIndexPage();
    }
    pageLoading = false;
  }
  async function tryGotoNextPage() {
    if (pageLoading) return;
    pageLoading = true;
    await workPagesStore.saveCurrentPage();
    currentPageIndex.value++;
    await completePages();
    await loadCurrentIndexPage();
    pageLoading = false;
  }
  async function tryGotoPageByIndex(index: number) {
    if (currentPageIndex.value === index) return;
    if (pageLoading) return;
    pageLoading = true;
    await workPagesStore.saveCurrentPage();
    currentPageIndex.value = index;
    await completePages();
    await loadCurrentIndexPage();
    pageLoading = false;
  }
  async function tryDeleteNowPage() {
    if (pageLoading) return;
    pageLoading = true;
    if (currentWorkPagesNum.value > 1) {
      currentWork.value.pageIds.splice(currentPageIndex.value, 1);
      currentPageIndex.value = Math.min(currentPageIndex.value, currentWorkPagesNum.value - 1);
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
