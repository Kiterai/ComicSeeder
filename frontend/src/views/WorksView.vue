<script setup lang="ts">
import { useWorks } from '@/stores/works';

const worksStore = useWorks();
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
          <div>{{ work.title }}</div>
          <div>{{ work.pageIds.length }} P</div>
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
</style>
