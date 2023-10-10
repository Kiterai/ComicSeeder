import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useWorks, type WorkData } from './works';

export const useDrawState = defineStore('drawState', () => {
  const penWidth = ref(10);
  const penWidthList = ref([5, 10, 20, 40, 50]);
  const penColor = ref('#444');
  const eraserWidth = ref(100);
  const eraserWidthList = ref([5, 10, 20, 40, 50]);
  const defaultFontSize = ref(32);
  const nowLayer = ref(0);
  const currentPageIndex = ref(0);
  const currentWorkId = ref<string | null>(null);
  const settingsPanelOpened = ref(false);

  const worksStore = useWorks();

  const currentWork = computed(() => {
    const dummy: WorkData = {
      id: '',
      title: 'dummy',
      pageIds: [],
      pageDirection: 'R2L',
      createdAt: '',
      updatedAt: ''
    };
    if (!currentWorkId.value) return dummy;
    const tmp = worksStore.works.find((work) => work.id === currentWorkId.value);
    if (!tmp) throw new Error(`invalid work id: ${currentWorkId.value}`);
    return tmp;
  });

  return {
    penWidth,
    penWidthList,
    penColor,
    eraserWidth,
    eraserWidthList,
    defaultFontSize,
    nowLayer,
    currentPageIndex,
    currentWorkId,
    settingsPanelOpened,
    currentWork
  };
});
