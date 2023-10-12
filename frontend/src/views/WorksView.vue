<script setup lang="ts">
import { useWorkPages } from '@/stores/workPages';
import { useWorks } from '@/stores/works';

const worksStore = useWorks();
const workPages = useWorkPages();
</script>

<template>
  <div>
    <RouterLink to="/">Return to Top</RouterLink>

    <div :class="$style.worksContainer">
      <RouterLink
        :class="$style.work"
        v-for="work in worksStore.works"
        :key="work.id"
        :to="`/works/${work.id}`"
        ><div :class="$style.workMeta">
          <img :class="$style.pageThumbnail" :src="workPages.pageThumbnail(work.pageIds[0])" />
          <div>{{ work.title }}</div>
          <div>{{ work.pageIds.length }} P</div>
          <div>{{ work.updatedAt }}</div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style module>
.worksContainer {
  display: flex;
}

.work {
  display: block;
  width: 10rem;
  height: 10rem;
  margin: 1rem;
  border-radius: 1rem;
  position: relative;
}

.work:hover {
  background-color: #0004;
}

.workMeta {
  position: absolute;
  text-align: center;
  width: 100%;
  bottom: 0;
  padding: 0.2rem;
}

.pageThumbnail {
  max-height: 5rem;
  max-width: 5rem;
  box-shadow: 0 0 0.2rem #0008;
}

</style>
