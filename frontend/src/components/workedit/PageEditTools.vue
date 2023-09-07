<script setup lang="ts"></script>

<template>
  <div :class="$style.tools">
    <button>move</button>
    <button>pen</button>
    <button>eraser</button>
  </div>
</template>

<style module>
.tools {
  position: fixed;
  bottom: 0;
}
</style>
