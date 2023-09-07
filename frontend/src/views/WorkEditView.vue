<script setup lang="ts">
const props = defineProps<{
  id: string
}>()
</script>

<template>
  <div>WorksEdit: {{ props.id }}</div>
  <RouterLink to="/works">Return to WorkList</RouterLink>
</template>

<style></style>
