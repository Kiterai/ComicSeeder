<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useWorks } from './stores/works';
import { Workbox } from 'workbox-window';

const reload = () => {
  const wb = new Workbox('/sw.js');
  wb.addEventListener('waiting', () => {
    const userConsent = window.confirm(
      'New version is available. Update?'
    );

    if (userConsent) {
      wb.messageSW({ type: 'SKIP_WAITING' });
    }
  });

  wb.addEventListener('controlling', () => {
    window.location.reload();
  });
  wb.register();
};
reload();

const works = useWorks();
</script>

<template>
  <RouterView v-if="works.loaded" />
</template>

<style scoped></style>
