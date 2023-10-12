<script setup lang="ts">
import IconBack from '@/components/icons/IconBack.vue';
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
  <RouterLink to="/works" :class="$style.menu">
    <IconBack />
  </RouterLink>

  <WorkEdit></WorkEdit>
</template>

<style module>
.menu {
  position: fixed;
  z-index: 1;
  width: 4rem;
  height: 4rem;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ccc;
  border: 0.1rem solid #000;
}
</style>
