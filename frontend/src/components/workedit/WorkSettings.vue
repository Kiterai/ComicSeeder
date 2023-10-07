<script setup lang="ts">
import { useDrawState } from '@/stores/drawState';
import { useWorks, type WorkData } from '@/stores/works';
import { computed, onUnmounted, toRaw } from 'vue';

const worksStore = useWorks();
const drawState = useDrawState();

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
</script>

<template>
  <div :class="$style.panel">
    <h2>Settings</h2>
    <dl>
      <dt>Title</dt>
      <dd><input type="text" :class="$style.titleInput" v-model="currentWork.title" /></dd>
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
</style>
