import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useWorks, type WorkData } from './works';

type PenSetting = {
  width: number;
  color: string;
  enablePressure: boolean;
};

export const useDrawState = defineStore('drawState', () => {
  const penSettingList = ref<PenSetting[]>([
    {
      width: 10,
      color: '#444',
      enablePressure: true
    },
    {
      width: 10,
      color: '#f44',
      enablePressure: true
    },
    {
      width: 10,
      color: '#44f',
      enablePressure: true
    }
  ]);
  const penSettingIndex = ref(0);
  const penWidth = computed(() => penSettingList.value[penSettingIndex.value].width);
  const penColor = computed(() => penSettingList.value[penSettingIndex.value].color);
  const penPressureEnabled = computed(
    () => penSettingList.value[penSettingIndex.value].enablePressure
  );
  const eraserWidthList = ref([10, 50, 100]);
  const eraserIndex = ref(0);
  const eraserWidth = computed(() => eraserWidthList.value[eraserIndex.value]);
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
    penSettingList,
    penSettingIndex,
    penWidth,
    penColor,
    penPressureEnabled,
    eraserWidthList,
    eraserIndex,
    eraserWidth,
    defaultFontSize,
    nowLayer,
    currentPageIndex,
    currentWorkId,
    settingsPanelOpened,
    currentWork
  };
});
