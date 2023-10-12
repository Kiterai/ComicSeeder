import { ref, computed, toRaw } from 'vue';
import { defineStore } from 'pinia';
import { useWorks, type WorkData } from './works';
import { connectDb, makeDbReqPromise } from '@/lib/indexedDb';

type PenSetting = {
  width: number;
  color: string;
  enablePressure: boolean;
};

type DeviceMode = 'pentouch' | 'touch';

type SavedState = {
  penSettingList: PenSetting[];
  penSettingIndex: number;
  eraserWidthList: number[];
  eraserIndex: number;
  defaultFontSize: number;
  deviceMode: DeviceMode;
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

  const deviceMode = ref<DeviceMode>('pentouch');

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

  const saveDrawStateConfig = async () => {
    await connectDb().then(async (db) => {
      const tra = db.transaction('drawStates', 'readwrite');
      const objStore = tra.objectStore('drawStates');
      const state: SavedState = {
        penSettingList: toRaw(penSettingList.value),
        penSettingIndex: penSettingIndex.value,
        eraserWidthList: toRaw(eraserWidthList.value),
        eraserIndex: eraserIndex.value,
        defaultFontSize: defaultFontSize.value,
        deviceMode: deviceMode.value
      };
      await makeDbReqPromise(objStore.put(state, 'state'));
    });
  };

  connectDb()
    .then((db) => {
      const tra = db.transaction('drawStates', 'readonly');
      const objStore = tra.objectStore('drawStates');
      return makeDbReqPromise<SavedState>(objStore.get('state'));
    })
    .then((res) => {
      penSettingList.value = res.penSettingList;
      penSettingIndex.value = res.penSettingIndex;
      eraserWidthList.value = res.eraserWidthList;
      eraserIndex.value = res.eraserIndex;
      defaultFontSize.value = res.defaultFontSize;
      deviceMode.value = res.deviceMode;
    })
    .catch((e) => {
      console.log('no draw settings saved');
    });

  return {
    saveDrawStateConfig,
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
    deviceMode,
    currentWork
  };
});
