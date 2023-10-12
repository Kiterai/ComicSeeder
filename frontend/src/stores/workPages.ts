import { computed, ref, toRaw } from 'vue';
import { defineStore } from 'pinia';
import { useCanvas } from './canvas';
import { getImgCompressed, getImgDecompressed } from '@/lib/imgCompress';
import { connectDb, makeDbReqPromise } from '@/lib/indexedDb';
import type { Rect, Size } from '@/lib/types';

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
  thumbnail: string | null;
};

export const useWorkPages = defineStore('workPages', () => {
  const currentPage = ref<PageData>({
    id: '',
    images: [],
    words: [],
    size: {
      width: 1,
      height: 1
    },
    thumbnail: null
  });
  const currentPageWidth = computed(() => (currentPage.value ? currentPage.value.size.width : 1));
  const currentPageHeight = computed(() => (currentPage.value ? currentPage.value.size.height : 1));

  const canvas = useCanvas();

  const generateNewId = () => {
    return new Date().getTime().toString(); // TODO: uuid
  };

  async function addBlankPage() {
    const newPage: PageData = {
      id: generateNewId(),
      images: [],
      words: [],
      size: {
        width: 1240, // A4, 150dpi
        height: 1754
      },
      thumbnail: null
    };
    await connectDb().then((db) => {
      const tra = db.transaction('workPages', 'readwrite');
      const objStore = tra.objectStore('workPages');
      return makeDbReqPromise(objStore.put(newPage));
    });
    return newPage.id;
  }

  function blobToDataUrl(blob: Blob) {
    return new Promise<string | ArrayBuffer | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function getThumbnailDataUrl() {
    const maxThumbnailWidth = 250;
    const maxThumbnailHeight = 300;
    const thumbnailWidth =
      maxThumbnailWidth * currentPage.value.size.height >=
      currentPage.value.size.width * maxThumbnailHeight
        ? maxThumbnailWidth
        : (currentPage.value.size.width * maxThumbnailHeight) / currentPage.value.size.height;
    const thumbnailHeight =
      maxThumbnailHeight * currentPage.value.size.width >=
      currentPage.value.size.height * maxThumbnailWidth
        ? maxThumbnailHeight
        : (currentPage.value.size.height * maxThumbnailWidth) / currentPage.value.size.width;

    const tmpCanvas = new OffscreenCanvas(thumbnailWidth, thumbnailHeight);
    const tmpCanvasCtx = tmpCanvas.getContext('2d');
    if (tmpCanvasCtx) {
      tmpCanvasCtx.drawImage(canvas.mainCanvas!, 0, 0, thumbnailWidth, thumbnailHeight);
      const thumbnailBlob = await tmpCanvas.convertToBlob();
      const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
      if (thumbnailDataUrl instanceof ArrayBuffer || thumbnailDataUrl === null)
        throw new Error('failed to generate thumbnail');
      return thumbnailDataUrl;
    } else {
      return null;
    }
  }

  async function saveCurrentPage() {
    currentPage.value.images = [await getImgCompressed(canvas.getImage())];
    currentPage.value.thumbnail = await getThumbnailDataUrl();
    await connectDb().then((db) => {
      const tra = db.transaction('workPages', 'readwrite');
      const objStore = tra.objectStore('workPages');
      return makeDbReqPromise(objStore.put(toRaw(currentPage.value))); // TODO
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
    currentPage,
    currentPageWidth,
    currentPageHeight,
    saveCurrentPage,
    loadPage,
    addBlankPage
  };
});
