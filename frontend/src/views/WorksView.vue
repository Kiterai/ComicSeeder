<script setup lang="ts">
import IconBack from '@/components/icons/IconBack.vue';
import IconExport from '@/components/icons/IconExport.vue';
import { useWorkPages } from '@/stores/workPages';
import { useWorks } from '@/stores/works';
import { computed, onMounted, ref } from 'vue';
import JSZip from 'jszip';
import streamSaver from 'streamsaver';
import { getImgDecompressed } from '@/lib/imgCompress';
import IconCheck from '@/components/icons/IconCheck.vue';
import IconCheckSmall from '@/components/icons/IconCheckSmall.vue';
import IconBin from '@/components/icons/IconBin.vue';

const worksStore = useWorks();
const workPages = useWorkPages();

onMounted(() => {
  worksStore.gabageCollect();
});

const sortedWorks = computed(() => {
  const works = worksStore.works.concat();
  works.sort((work1, work2) => {
    if (work1.updatedAt < work2.updatedAt) return 1;
    if (work1.updatedAt > work2.updatedAt) return -1;
    return 0;
  });
  return works;
});

const checkMode = ref(false);
function switchCheckMode() {
  checkMode.value = !checkMode.value;
  if (!checkMode.value) checkedWorksId.value = [];
}

const checkedWorksId = ref<string[]>([]);

async function genExportFilesZip() {
  const zip = new JSZip();
  const exportWorksSet = new Set(checkedWorksId.value);
  const worksProcess = worksStore.works
    .filter((work) => exportWorksSet.has(work.id))
    .map(async (work) => {
      const folder = zip.folder(`${work.title}-id${work.id}`);
      if (!folder) throw new Error('failed to create zip folder');

      const pageStringLen = work.pageIds.length.toString().length + 2;
      const pagesProcess = work.pageIds.map(async (pageId, _index) => {
        const index = _index + 1;
        const page = await workPages.getRawPageData(pageId);

        const tmpLayerCanvas = new OffscreenCanvas(page.size.width, page.size.height);
        const tmpLayerCtx = tmpLayerCanvas.getContext('2d');
        const tmpPageCanvas = new OffscreenCanvas(page.size.width, page.size.height);
        const tmpPageCtx = tmpPageCanvas.getContext('2d');
        if (!tmpLayerCtx || !tmpPageCtx) throw new Error('failed to setup offscreen canvas');
        tmpPageCtx.fillStyle = '#fff';
        tmpPageCtx.fillRect(0, 0, page.size.width, page.size.height);
        for (const rawImgData of page.images) {
          const imageData = new ImageData(
            await getImgDecompressed(rawImgData),
            page.size.width,
            page.size.height
          );
          tmpLayerCtx.putImageData(imageData, 0, 0);
          tmpPageCtx.drawImage(tmpLayerCanvas, 0, 0);
        }
        const pageImageBlob = await tmpPageCanvas.convertToBlob();

        const filename = `${index.toString().padStart(pageStringLen, '0')}.png`;
        folder.file(filename, pageImageBlob);
      });
      await Promise.all(pagesProcess);
    });
  await Promise.all(worksProcess);
  return zip;
}
async function onExport() {
  const zipStream = streamSaver.createWriteStream('works-export.zip');
  const writer = zipStream.getWriter();
  const zip = await genExportFilesZip();
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const blobStream = blob.stream();
  const blobReader = blobStream.getReader();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await blobReader.read();
    if (res.done) {
      writer.close();
      break;
    }
    await writer.write(res.value);
  }
}
async function onDelete() {
  if (!confirm('Checked works will be deleted. OK?')) return;
  worksStore.deleteWorks(checkedWorksId.value);
  checkedWorksId.value = [];
}
</script>

<template>
  <div>
    <div :class="$style.toolButtonContainer">
      <RouterLink v-show="!checkMode" to="/" :class="[$style.toolButton, $style.toolButtonBack]"
        ><IconBack
      /></RouterLink>
      <button
        v-show="checkMode"
        :onclick="onDelete"
        :class="[$style.toolButton, $style.toolButtonDelete]"
        :disabled="checkedWorksId.length === 0"
      >
        <IconBin />
      </button>
      <button
        v-show="checkMode"
        :onclick="onExport"
        :class="[$style.toolButton, $style.toolButtonExport]"
        :disabled="checkedWorksId.length === 0"
      >
        <IconExport />
      </button>
      <button
        :onclick="switchCheckMode"
        :class="$style.checkModeSwitch"
        :data-mode-active="checkMode"
      >
        <IconCheck />
      </button>
    </div>

    <div :class="$style.worksContainer">
      <div :class="$style.work" v-for="work in sortedWorks" :key="work.id">
        <div v-show="checkMode" :class="$style.workExportOptions">
          <input
            :id="`export-${work.id}`"
            type="checkbox"
            :value="work.id"
            v-model="checkedWorksId"
            :class="$style.workCheck"
          />
          <div :class="$style.workCheckSymbol"><IconCheckSmall /></div>
        </div>
        <label :class="$style.workCheckLabel" :for="`export-${work.id}`"></label>
        <div :class="$style.thumbnailContainer">
          <img :class="$style.pageThumbnail" :src="workPages.pageThumbnail(work.pageIds[0])" />
        </div>
        <div :class="$style.workMeta">
          <div>{{ work.title }} ({{ work.pageIds.length }}P)</div>
          <div>{{ work.updatedAt }}</div>
        </div>
        <RouterLink v-show="!checkMode" :class="$style.workLink" :to="`/works/${work.id}`">
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style module>
.toolButtonContainer {
  position: sticky;
  display: inline-flex;
  box-shadow: 0 0 0.5rem #0008;
}

.toolButton {
  width: 4rem;
  height: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  transition:
    background-color 0.1s ease,
    color 0.1s ease;
  cursor: pointer;
  border: none;
}
.toolButton[disabled] {
  background-color: #ccc;
  color: #ddd;
  cursor: default;
}
.toolButtonBack {
  background-color: #fff;
  color: #000;
}
.toolButtonBack:hover {
  background-color: #ddd;
}
.toolButtonExport {
  background-color: #fa5;
  color: #fff;
}
.toolButtonExport:hover {
  background-color: #d93;
  color: #ddd;
}
.toolButtonDelete {
  background-color: #f44;
  color: #fff;
}
.toolButtonDelete:hover {
  background-color: #c22;
  color: #ddd;
}

.checkModeSwitch {
  position: fixed;
  top: 0;
  right: 0;
  border: none;
  width: 4rem;
  height: 4rem;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 0 0.5rem #0008;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  cursor: pointer;
}
.checkModeSwitch:hover {
  background-color: #ddd;
}
.checkModeSwitch[data-mode-active='true'] {
  background-color: #444;
  color: #fff;
}
.checkModeSwitch[data-mode-active='true']:hover {
  background-color: #666;
  color: #ccc;
}

.worksContainer {
  display: flex;
  flex-wrap: wrap;
}

.work {
  display: block;
  width: 10rem;
  margin: 1rem;
  border-radius: 1rem;
  position: relative;
}

.work:hover {
  background-color: #0004;
}
.workExportOptions {
  position: absolute;
}
.workCheck {
  visibility: hidden;
}
.workCheck + .workCheckSymbol {
  position: absolute;
  left: 0.3rem;
  top: 0.3rem;
  border-radius: 1rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #eee;
  border: 0.1rem solid #999;
  color: transparent;
  transition:
    background-color ease 0.1s,
    color ease 0.1s;
}
.workCheck:checked + .workCheckSymbol {
  background-color: #fff;
  color: #3af;
  border-color: #3af;
  font-size: 0.5rem;
}

.workCheckLabel {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}

.workLink {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.workMeta {
  text-align: center;
  width: 100%;
  padding: 0.2rem;
}

.thumbnailContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 8rem;
}
.pageThumbnail {
  max-height: 7rem;
  max-width: 9rem;
  box-shadow: 0 0 0.2rem #0008;
}
</style>
