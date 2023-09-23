import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useWorkPages = defineStore('workPages', () => {
  const pages = ref<Array<Uint8Array>>([]);
  const nowPage = ref(0);
  return { pages, nowPage };
});
