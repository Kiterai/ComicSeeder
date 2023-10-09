<script setup lang="ts">
import PageList from './PageList.vue';
import PageEdit from './PageEdit.vue';
import WorkSettings from './WorkSettings.vue';
import PageEditTools from './PageEditTools.vue';
import { useDrawState } from '@/stores/drawState';
import { onUnmounted } from 'vue';
import { useOpeHistory } from '@/stores/opeHistory';

const drawState = useDrawState();
const opeHistory = useOpeHistory();

onUnmounted(() => {
  drawState.currentPageIndex = 0;
  opeHistory.clearHistory();
});
</script>

<template>
  <div :class="$style.workedit">
    <PageList></PageList>
    <PageEdit :pageId="null"></PageEdit>
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
