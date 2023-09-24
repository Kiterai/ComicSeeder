import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useDrawState = defineStore('drawState', () => {
  const penWidth = ref(10);
  const penWidthList = ref([5, 10, 20, 40, 50]);
  const penColor = ref('#444');
  const eraserWidth = ref(10);
  const eraserWidthList = ref([5, 10, 20, 40, 50]);
  const nowLayer = ref(0);
  return { penWidth, penWidthList, penColor, eraserWidth, eraserWidthList, nowLayer };
});
