<script setup lang="ts">
import IconBack from '@/components/icons/IconBack.vue';
import IconExport from '@/components/icons/IconExport.vue';
import IconUndo from '@/components/icons/IconUndo.vue';
import { useWorkPages } from '@/stores/workPages';
import { useWorks } from '@/stores/works';
import { computed, ref } from 'vue';
import JSZip from 'jszip';
import streamSaver from 'streamsaver';
import { getImgDecompressed } from '@/lib/imgCompress';

const worksStore = useWorks();
const workPages = useWorkPages();

const sortedWorks = computed(() => {
  const works = worksStore.works.concat();
  works.sort((work1, work2) => {
    if (work1.updatedAt < work2.updatedAt) return 1;
    if (work1.updatedAt > work2.updatedAt) return -1;
    return 0;
  });
  return works;
});

const exportMode = ref(false);
function switchExportMode() {
  exportMode.value = !exportMode.value;
}

const exportWorksId = ref<string[]>([]);

async function zipExportFiles(zip: JSZip) {
  const exportWorksSet = new Set(exportWorksId.value);
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
}
async function onExport() {
  const zipStream = streamSaver.createWriteStream('works-export.zip');
  const writer = zipStream.getWriter();
  const zip = new JSZip();
  await zipExportFiles(zip);

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
</script>

<template>
  <div>
    <RouterLink v-show="!exportMode" to="/" :class="$style.back"><IconBack /></RouterLink>
    <button v-show="exportMode" :onclick="onExport" :class="$style.export"><IconUndo /></button>
    <button :onclick="switchExportMode" :class="$style.exportSwitch" :data-mode-active="exportMode">
      <IconExport />
    </button>

    <div :class="$style.worksContainer">
      <div :class="$style.work" v-for="work in sortedWorks" :key="work.id">
        <div v-show="exportMode" :class="$style.workExportOptions">
          <input
            :id="`export-${work.id}`"
            type="checkbox"
            :value="work.id"
            v-model="exportWorksId"
          />
          Export This
        </div>
        <label :class="$style.exportCheckLabel" :for="`export-${work.id}`"></label>
        <div :class="$style.thumbnailContainer">
          <img :class="$style.pageThumbnail" :src="workPages.pageThumbnail(work.pageIds[0])" />
        </div>
        <div :class="$style.workMeta">
          <div>{{ work.title }} ({{ work.pageIds.length }}P)</div>
          <div>{{ work.updatedAt }}</div>
        </div>
        <RouterLink v-show="!exportMode" :class="$style.workLink" :to="`/works/${work.id}`">
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style module>
.back {
  position: sticky;
  top: 0;
  left: 0;
  width: 4rem;
  height: 4rem;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 0 0.5rem #0008;
  transition: background-color 0.1s ease;
  cursor: pointer;
}
.back:hover {
  background-color: #ddd;
}

.export {
  position: sticky;
  width: 4rem;
  height: 4rem;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 0 0.5rem #0008;
  transition: background-color 0.1s ease;
  cursor: pointer;
  border: none;
}
.export:hover {
  background-color: #ddd;
}
.exportSwitch {
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
.exportSwitch:hover {
  background-color: #ddd;
}
.exportSwitch[data-mode-active='true'] {
  background-color: #f44;
  color: #fff;
}
.exportSwitch[data-mode-active='true']:hover {
  background-color: #c44;
  color: #ccc;
}

.worksContainer {
  display: flex;
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
  padding: 0.2rem 0.5rem 0;
}

.exportCheckLabel {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
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
