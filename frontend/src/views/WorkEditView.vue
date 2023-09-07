<script setup lang="ts">
import WorkEdit from '@/components/workedit/WorkEdit.vue';

const props = defineProps<{
  id: string
}>()
</script>

<template>
  <div>WorksEdit: {{ props.id }}</div>
  <RouterLink to="/works">Return to WorkList</RouterLink>

  <WorkEdit></WorkEdit>
</template>

<style></style>
