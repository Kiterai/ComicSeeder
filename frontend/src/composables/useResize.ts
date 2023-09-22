import { onMounted, onUnmounted } from 'vue';

export const useResize = (onresize: (e: UIEvent) => void) => {
  onMounted(() => {
    window.addEventListener('resize', onresize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', onresize);
  });
  return {};
};
