import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useWorkPages } from './workPages';

export const useCanvas = defineStore('canvas', () => {
  const mainCanvas = ref<HTMLCanvasElement | null>(null);
  const tmpCanvas = ref<HTMLCanvasElement | null>(null);
  const ctx = computed(() => (mainCanvas.value ? mainCanvas.value.getContext('2d') : null));
  const tmpctx = computed(() => (tmpCanvas.value ? tmpCanvas.value.getContext('2d') : null));

  const workPage = useWorkPages();

  function setup(newMainCanvas: HTMLCanvasElement, newTmpCanvas: HTMLCanvasElement) {
    mainCanvas.value = newMainCanvas;
    tmpCanvas.value = newTmpCanvas;
  }
  function getImage() {
    return ctx.value!.getImageData(0, 0, workPage.currentPageWidth, workPage.currentPageHeight);
  }
  function putImage(dat: ImageData) {
    ctx.value!.putImageData(dat, 0, 0);
  }

  return { setup, ctx, tmpctx, getImage, putImage };
});