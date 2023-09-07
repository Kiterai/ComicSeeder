<script setup lang="ts">
import WorkEdit from '@/components/workedit/WorkEdit.vue';

const props = defineProps<{
  id: string;
}>();
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
