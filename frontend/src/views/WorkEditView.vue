<script setup lang="ts">
import WorkEdit from '@/components/workedit/WorkEdit.vue';
import { useDrawState } from '@/stores/drawState';
import { useWorkPages } from '@/stores/workPages';
import { onBeforeRouteLeave } from 'vue-router';

const props = defineProps<{
  id: string;
}>();

const drawStateStore = useDrawState();
drawStateStore.currentWorkId = props.id;

const workPagesStore = useWorkPages();

onBeforeRouteLeave(async (to, from, next) => {
  await workPagesStore.saveCurrentPage();
  next();
});
</script>

<template>
  <RouterLink to="/works" :class="$style.menu">Return to WorkList</RouterLink>

  <WorkEdit></WorkEdit>
</template>

<style module>
.menu {
  position: fixed;
  z-index: 1;
}
</style>
