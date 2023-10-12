<script setup lang="ts">
import IconBack from '@/components/icons/IconBack.vue';
import { useWorkPages } from '@/stores/workPages';
import { useWorks } from '@/stores/works';
import { computed } from 'vue';

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
</script>

<template>
  <div>
    <RouterLink to="/" :class="$style.back"><IconBack /></RouterLink>

    <div :class="$style.worksContainer">
      <RouterLink
        :class="$style.work"
        v-for="work in sortedWorks"
        :key="work.id"
        :to="`/works/${work.id}`"
      >
        <div :class="$style.thumbnailContainer">
          <img :class="$style.pageThumbnail" :src="workPages.pageThumbnail(work.pageIds[0])" />
        </div>
        <div :class="$style.workMeta">
          <div>{{ work.title }} ({{ work.pageIds.length }}P)</div>
          <div>{{ work.updatedAt }}</div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style module>
.back {
  width: 4rem;
  height: 4rem;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 0 0.5rem #0008;
  transition: background-color 0.1s ease;
}
.back:hover {
  background-color: #ddd;
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
