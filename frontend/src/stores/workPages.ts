import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useCanvas } from './canvas';
import { getImgCompressed, getImgDecompressed } from '@/lib/imgCompress';
import { connectDb, makeDbReqPromise } from '@/lib/indexedDb';

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Size = {
  width: number;
  height: number;
};

export type PageWord = {
  id: number;
  rect: Rect;
  word: string;
  fontSize: number;
};

export type PageData = {
  id: string;
  images: Array<Uint8Array>;
  words: Array<PageWord>;
  size: Size;
};

export const useWorkPages = defineStore('workPages', () => {
  const currentPageIndex = ref(0);
  const currentPage = ref<PageData>({
    id: '',
    images: [],
    words: [],
    size: {
      width: 1,
      height: 1
    }
  });
  const currentPageWidth = computed(() => (currentPage.value ? currentPage.value.size.width : 1));
  const currentPageHeight = computed(() => (currentPage.value ? currentPage.value.size.height : 1));

  const canvas = useCanvas();

  const generateNewId = () => {
    return new Date().toISOString(); // TODO: uuid
  };

  async function addBlankPage() {
    const newPage: PageData = {
      id: generateNewId(),
      images: [],
      words: [],
      size: {
        width: 1240, // A4, 150dpi
        height: 1754
      }
    };
    await connectDb().then((db) => {
      const tra = db.transaction('workPages', 'readwrite');
      const objStore = tra.objectStore('workPages');
      return makeDbReqPromise(objStore.put(newPage, newPage.id));
    });
    return newPage.id;
  }

  async function saveCurrentPage() {
    currentPage.value.images = [await getImgCompressed(canvas.getImage())];
    await connectDb().then((db) => {
      const tra = db.transaction('workPages', 'readwrite');
      const objStore = tra.objectStore('workPages');
      return makeDbReqPromise(objStore.put(currentPage.value, currentPage.value.id));
    });
  }
  async function loadPage(id: string) {
    await connectDb()
      .then((db) => {
        const tra = db.transaction('workPages', 'readonly');
        const objStore = tra.objectStore('workPages');
        return makeDbReqPromise<PageData>(objStore.get(id));
      })
      .then((data) => {
        currentPage.value = data;
      });

    if (currentPage.value.images.length > 0) {
      for (const rawImgData of currentPage.value.images) {
        const imgData = new ImageData(
          await getImgDecompressed(rawImgData),
          currentPageWidth.value,
          currentPageHeight.value
        );

        canvas.clear();
        canvas.putImage(imgData);
      }
    } else {
      canvas.clear();
    }
  }

  return {
    currentPageIndex,
    currentPage,
    currentPageWidth,
    currentPageHeight,
    saveCurrentPage,
    loadPage,
    addBlankPage
  };
});
