<script setup lang="ts">
import { useWorks } from '@/stores/works';
import { useRouter } from 'vue-router';

const router = useRouter();

const works = useWorks();
const moveToNewWork = async () => {
  const newId = await works.addWork();
  router.push(`/works/${newId}`);
};
</script>

<template>
  <div :class="$style.outerContainer">
    <h1 :class="$style.logo">ComicSeeder</h1>
    <div :class="$style.container">
      <RouterLink to="/works" :class="$style.topButton">Works List</RouterLink>
      <button :class="$style.topButton" :onclick="moveToNewWork">New Work</button>
    </div>
  </div>
</template>

<style module>
.outerContainer {
  width: 100dvw;
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.container {
  width: 20rem;
  max-width: 100%;
  height: 10rem;
  display: flex;
}
.topButton {
  text-align: center;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  cursor: pointer;
  background-color: #fff;
  border: 0.2rem solid #8e8;
  color: #8e8;
  margin: 0 0.2rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-weight: bold;
}
.topButton:hover {
  background-color: #8e8;
  color: #fff;
}
.logo {
}
</style>
