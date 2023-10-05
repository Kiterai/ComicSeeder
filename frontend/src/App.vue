<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useWorks } from './stores/works';

const works = useWorks();
</script>

<template>
  <RouterView v-if="works.loaded" />
</template>

<style scoped></style>
