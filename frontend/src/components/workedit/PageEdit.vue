<script setup lang="ts">
import PageEditCanvas from './PageEditCanvas.vue';

const props = defineProps<{
    pageId: string | null
}>();

</script>

<template>
    <PageEditCanvas></PageEditCanvas>
</template>

<style scoped lang="scss"></style>
