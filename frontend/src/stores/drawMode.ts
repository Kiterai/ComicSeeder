import { ref } from 'vue';
import { defineStore } from 'pinia';

export type DrawMode = 'move' | 'pen' | 'eraser' | 'word';

export const useDrawMode = defineStore('drawMode', () => {
  const mode = ref<DrawMode>('pen');
  return { mode };
});
