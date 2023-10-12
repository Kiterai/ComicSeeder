<script setup lang="ts">
import PageList from './PageList.vue';
import PageEdit from './PageEdit.vue';
import WorkSettings from './WorkSettings.vue';
import PageEditTools from './PageEditTools.vue';
import { useDrawState } from '@/stores/drawState';
import { onMounted, onUnmounted } from 'vue';
import { useOpeHistory } from '@/stores/opeHistory';
import { useWorkPages } from '@/stores/workPages';

const drawState = useDrawState();
const opeHistory = useOpeHistory();
const workPage = useWorkPages();

let saveTimer = -1;

onMounted(() => {
  saveTimer = setInterval(() => {
    workPage.saveCurrentPage();
  }, 15000);
});

onUnmounted(() => {
  drawState.currentPageIndex = 0;
  opeHistory.clearHistory();
  clearInterval(saveTimer);
});
</script>

<template>
  <div :class="$style.workedit">
    <PageEdit :pageId="null"></PageEdit>
    <PageList></PageList>
    <WorkSettings v-if="drawState.settingsPanelOpened"></WorkSettings>
    <PageEditTools></PageEditTools>
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
