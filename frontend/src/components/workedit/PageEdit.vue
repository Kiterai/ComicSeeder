<script setup lang="ts">
import PageEditCanvas from './PageEditCanvas.vue';
import PageEditTools from './PageEditTools.vue';

const props = defineProps<{
    pageId: string | null
}>();

</script>

<template>
    <PageEditCanvas></PageEditCanvas>
    <PageEditTools></PageEditTools>
</template>

<style scoped lang="scss"></style>
