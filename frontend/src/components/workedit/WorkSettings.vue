<script setup lang="ts">
import { usePageOperation } from '@/composables/usePageOperation';
import type { Size } from '@/lib/types';
import { useCanvas } from '@/stores/canvas';
import { useDrawState } from '@/stores/drawState';
import { useOpeHistory } from '@/stores/opeHistory';
import { useWorkPages } from '@/stores/workPages';
import { useWorks, type WorkData } from '@/stores/works';
import { computed, onUnmounted, ref, toRaw, watch } from 'vue';

const worksStore = useWorks();
const workPageStore = useWorkPages();
const drawState = useDrawState();
const canvas = useCanvas();
const opeHistory = useOpeHistory();
const pageOperation = usePageOperation();

const currentWork = computed(() => {
  const dummy: WorkData = {
    id: '',
    title: 'dummy',
    pageIds: [],
    createdAt: '',
    updatedAt: ''
  };
  if (!drawState.currentWorkId) return dummy;
  const tmp = worksStore.works.find((work) => work.id === drawState.currentWorkId);
  if (!tmp) throw new Error(`invalid work id: ${drawState.currentWorkId}`);
  return tmp;
});

onUnmounted(() => {
  worksStore.updateWork(toRaw(currentWork.value));
});

const pageSizeMap = new Map<string, Size>([
  [
    'A4dpi150',
    {
      width: 1240,
      height: 1754
    }
  ],
  [
    'OpenA4dpi150',
    {
      width: 2480,
      height: 1754
    }
  ]
]);
const pageSize = ref('A4dpi150');
watch(pageSize, (newVal, oldVal) => {
  if (newVal == 'other') {
    // TODO
    return;
  }
  const newSize = pageSizeMap.get(newVal);
  if (!newSize) return;

  opeHistory.beginOperation();
  const index = drawState.currentPageIndex;
  const oldSize = structuredClone(toRaw(workPageStore.currentPage.size));

  const img = canvas.getImage();
  workPageStore.currentPage.size = newSize;
  canvas.putImage(img);
  workPageStore.saveCurrentPage();

  opeHistory.commitOperation({
    undo: async () => {
      pageOperation.tryGotoPageByIndex(index);
      const img = canvas.getImage();
      workPageStore.currentPage.size = oldSize;
      canvas.putImage(img);
      workPageStore.saveCurrentPage();
    },
    redo: async () => {
      pageOperation.tryGotoPageByIndex(index);
      const img = canvas.getImage();
      workPageStore.currentPage.size = newSize;
      canvas.putImage(img);
      workPageStore.saveCurrentPage();
    }
  });
});
</script>

<template>
  <div :class="$style.panel">
    <h2>Settings</h2>
    <dl>
      <dt>Title</dt>
      <dd><input type="text" :class="$style.titleInput" v-model="currentWork.title" /></dd>
    </dl>
    <dl>
      <dt>Size</dt>
      <dd>
        <select v-model="pageSize" :class="$style.pageSizeInput">
          <option value="A4dpi150">A4, 150dpi</option>
          <option value="OpenA4dpi150">A4見開き, 150dpi</option>
          <option value="other">その他</option>
        </select>
      </dd>
    </dl>
  </div>
</template>

<style module>
.panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 20rem;
  background: #ccc;
  height: 100dvh;
  padding: 1rem;
  box-shadow: 0 0 2rem #0008;
}

.titleInput {
  font-size: 1.3rem;
}
.pageSizeInput {
  font-size: 1.3rem;
}
</style>
