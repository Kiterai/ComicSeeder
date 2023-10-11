<script setup lang="ts">
import { usePageOperation } from '@/composables/usePageOperation';
import type { Size } from '@/lib/types';
import { useCanvas } from '@/stores/canvas';
import { useDrawMode } from '@/stores/drawMode';
import { useDrawState } from '@/stores/drawState';
import { useOpeHistory } from '@/stores/opeHistory';
import { useWorkPages } from '@/stores/workPages';
import { useWorks } from '@/stores/works';
import { onUnmounted, ref, toRaw, watch } from 'vue';

const worksStore = useWorks();
const workPageStore = useWorkPages();
const drawState = useDrawState();
const drawMode = useDrawMode();
const canvas = useCanvas();
const opeHistory = useOpeHistory();
const pageOperation = usePageOperation();

onUnmounted(() => {
  worksStore.updateWork(toRaw(drawState.currentWork));
  drawState.saveDrawStateConfig();
});

const pageSizeMap = new Map<string, Size>([
  [
    'A4dpi150',
    {
      width: 1240,
      height: 1754
    }
  ],
  [
    'OpenA4dpi150',
    {
      width: 2480,
      height: 1754
    }
  ]
]);
const pageSize = ref('A4dpi150');
watch(pageSize, (newVal, oldVal) => {
  if (newVal == 'other') {
    // TODO
    return;
  }
  const newSize = pageSizeMap.get(newVal);
  if (!newSize) return;

  opeHistory.beginOperation();
  const index = drawState.currentPageIndex;
  const oldSize = structuredClone(toRaw(workPageStore.currentPage.size));

  const img = canvas.getImage();
  workPageStore.currentPage.size = newSize;
  canvas.putImage(img);
  workPageStore.saveCurrentPage();

  opeHistory.commitOperation({
    undo: async () => {
      pageOperation.tryGotoPageByIndex(index);
      const img = canvas.getImage();
      workPageStore.currentPage.size = oldSize;
      canvas.putImage(img);
      workPageStore.saveCurrentPage();
    },
    redo: async () => {
      pageOperation.tryGotoPageByIndex(index);
      const img = canvas.getImage();
      workPageStore.currentPage.size = newSize;
      canvas.putImage(img);
      workPageStore.saveCurrentPage();
    }
  });
});

// watch(workPageStore.currentPage.size, (newVal, oldVal) => {
//   for (const [name, size] of pageSizeMap.entries()) {
//     if (newVal.width == size.width && newVal.height == size.height) {
//       pageSize.value = name;
//     }
//   }
// });

function onSelectPen(e: MouseEvent) {
  if (!(e.target instanceof HTMLElement)) return;
  drawState.penSettingIndex = Number(e.target.dataset.index);
}
function onAddPen() {
  drawState.penSettingList.push({
    color: '#444',
    width: 10,
    enablePressure: true
  });
}
function onDeletePen() {
  if (drawState.penSettingList.length == 1) return;
  if (drawState.penSettingIndex >= drawState.penSettingList.length - 1) {
    drawState.penSettingIndex--;
    drawState.penSettingList.pop();
  } else {
    drawState.penSettingList.splice(drawState.penSettingIndex, 1);
  }
}

function onSelectEraser(e: MouseEvent) {
  if (!(e.target instanceof HTMLElement)) return;
  drawState.eraserIndex = Number(e.target.dataset.index);
}
function onAddEraser() {
  drawState.eraserWidthList.push(100);
}
function onDeleteEraser() {
  if (drawState.eraserWidthList.length == 1) return;
  if (drawState.eraserIndex >= drawState.eraserWidthList.length - 1) {
    drawState.eraserIndex--;
    drawState.eraserWidthList.pop();
  } else {
    drawState.eraserWidthList.splice(drawState.eraserIndex, 1);
  }
}
</script>

<template>
  <div :class="$style.panel">
    <h2>Settings</h2>
    <dl>
      <dt>Title</dt>
      <dd><input type="text" v-model="drawState.currentWork.title" /></dd>
    </dl>
    <dl>
      <dt>Direction</dt>
      <dd>
        <select v-model="drawState.currentWork.pageDirection">
          <option value="R2L">右から左</option>
          <option value="L2R">左から右</option>
        </select>
      </dd>
    </dl>
    <h3>Tool setting</h3>
    <div v-if="drawMode.mode == 'pen'" style="display: flex; flex-wrap: wrap">
      <div
        v-for="(setting, index) in drawState.penSettingList"
        :key="index"
        :style="{
          width: '3rem',
          height: '3rem',
          backgroundColor: setting.color,
          margin: '0.2rem',
          border: index == drawState.penSettingIndex ? '0.2rem solid #fff' : 'none',
          cursor: 'pointer'
        }"
        :data-index="index"
        :onclick="onSelectPen"
      ></div>
      <div
        :style="{
          width: '3rem',
          height: '3rem',
          margin: '0.2rem',
          border: '0.2rem solid #fff',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '3rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }"
        :onclick="onAddPen"
      >
        +
      </div>
    </div>
    <dl v-if="drawMode.mode == 'pen'">
      <dt>pen size</dt>
      <dd>
        <input type="number" v-model="drawState.penSettingList[drawState.penSettingIndex].width" />
      </dd>
      <dt>pen color</dt>
      <dd>
        <input type="text" v-model="drawState.penSettingList[drawState.penSettingIndex].color" />
      </dd>
      <dt>pressure enable</dt>
      <dd>
        <input
          type="checkbox"
          v-model="drawState.penSettingList[drawState.penSettingIndex].enablePressure"
        />
      </dd>
      <button
        style="
          background-color: #f00;
          color: #fff;
          padding: 0.3rem;
          border: 0.1rem solid #000;
          border-radius: 0.5rem;
          cursor: pointer;
        "
        :onclick="onDeletePen"
      >
        Delete
      </button>
    </dl>
    <div v-if="drawMode.mode == 'eraser'" style="display: flex; flex-wrap: wrap">
      <div
        v-for="(width, index) in drawState.eraserWidthList"
        :key="index"
        :style="{
          width: '3rem',
          height: '3rem',
          backgroundColor: '#fff',
          margin: '0.2rem',
          border: index == drawState.eraserIndex ? '0.2rem solid #000' : 'none',
          cursor: 'pointer'
        }"
        :data-index="index"
        :onclick="onSelectEraser"
      ></div>
      <div
        :style="{
          width: '3rem',
          height: '3rem',
          margin: '0.2rem',
          border: '0.2rem solid #fff',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '3rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }"
        :onclick="onAddEraser"
      >
        +
      </div>
    </div>
    <dl v-if="drawMode.mode == 'eraser'">
      <dt>eraser size</dt>
      <dd><input type="number" v-model="drawState.eraserWidthList[drawState.eraserIndex]" /></dd>
      <button
        style="
          background-color: #f00;
          color: #fff;
          padding: 0.3rem;
          border: 0.1rem solid #000;
          border-radius: 0.5rem;
          cursor: pointer;
        "
        :onclick="onDeleteEraser"
      >
        Delete
      </button>
    </dl>
    <dl v-if="drawMode.mode == 'word'">
      <dt>default font size</dt>
      <dd><input type="number" v-model="drawState.defaultFontSize" /></dd>
    </dl>
    <!-- <dl>
      <dt>Size</dt>
      <dd>
        <select v-model="pageSize" :class="$style.pageSizeInput">
          <option value="A4dpi150">A4, 150dpi</option>
          <option value="OpenA4dpi150">A4見開き, 150dpi</option>
          <option value="other">その他</option>
        </select>
      </dd>
    </dl>-->
  </div>
</template>

<style module>
.panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 20rem;
  background: #ccc;
  height: 100dvh;
  padding: 1rem;
  box-shadow: 0 0 2rem #0008;
}

input {
  font-size: 1.3rem;
}

h3 {
  margin-top: 1rem;
}

.titleInput {
}
.pageSizeInput {
}
</style>
