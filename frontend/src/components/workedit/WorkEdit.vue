<script setup lang="ts">
import PageList from './PageList.vue';
import PageEdit from './PageEdit.vue';
</script>

<template>
  <div :class="$style.workedit">
    <PageList></PageList>
    <PageEdit :pageId="null"></PageEdit>
  </div>
</template>

<style module>
.workedit {
  position: fixed;
  height: 100dvh;
  width: 100dvw;
  overflow: hidden;
}
</style>
