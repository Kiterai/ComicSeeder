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
import IconPlus from '../icons/IconPlus.vue';

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
          <option value="R2L">Right to Left</option>
          <option value="L2R">Left to Right</option>
        </select>
      </dd>
    </dl>
    <dl>
      <dt>Device Mode</dt>
      <dd>
        <select v-model="drawState.deviceMode">
          <option value="pentouch">Pen & Touch Device</option>
          <option value="touch">Touch Device</option>
        </select>
      </dd>
    </dl>
    <h3>Tool setting</h3>
    <div v-if="drawMode.mode == 'pen'" style="display: flex; flex-wrap: wrap">
      <div
        v-for="(setting, index) in drawState.penSettingList"
        :key="index"
        :class="$style.penSetting"
        :style="{
          backgroundColor: setting.color
        }"
        :data-current="index == drawState.penSettingIndex"
        :data-index="index"
        :onpointerup="onSelectPen"
      ></div>
      <div :class="$style.addButton" :onpointerup="onAddPen">
        <IconPlus />
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
      <button :class="$style.deleteButton" :onpointerup="onDeletePen">Delete</button>
    </dl>
    <div v-if="drawMode.mode == 'eraser'" style="display: flex; flex-wrap: wrap">
      <div
        v-for="(width, index) in drawState.eraserWidthList"
        :key="index"
        :class="$style.eraserSetting"
        :data-current="index == drawState.eraserIndex"
        :data-index="index"
        :onpointerup="onSelectEraser"
      ></div>
      <div :class="$style.addButton" :onpointerup="onAddEraser">
        <IconPlus />
      </div>
    </div>
    <dl v-if="drawMode.mode == 'eraser'">
      <dt>eraser size</dt>
      <dd><input type="number" v-model="drawState.eraserWidthList[drawState.eraserIndex]" /></dd>
      <button :class="$style.deleteButton" :onpointerup="onDeleteEraser">Delete</button>
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

.penSetting {
  width: 3rem;
  height: 3rem;
  margin: 0.2rem;
  border: none;
  cursor: pointer;
}
.penSetting:hover {
  border: 0.2rem solid #888;
}
.penSetting[data-current='true'] {
  border: 0.2rem solid #fff;
}
.eraserSetting {
  width: 3rem;
  height: 3rem;
  background-color: #fff;
  margin: 0.2rem;
  border: none;
  cursor: pointer;
}
.eraserSetting:hover {
  border: 0.2rem solid #888;
}
.eraserSetting[data-current='true'] {
  border: 0.2rem solid #000;
}

.addButton {
  width: 3rem;
  height: 3rem;
  margin: 0.2rem;
  border: 0.2rem solid #fff;
  cursor: pointer;
  color: #fff;
  font-size: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.addButton:hover {
  border-color: #eee;
  color: #eee;
}

.deleteButton {
  background-color: #f00;
  color: #fff;
  padding: 0.3rem;
  border: 0.1rem solid #000;
  border-radius: 0.5rem;
  cursor: pointer;
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
