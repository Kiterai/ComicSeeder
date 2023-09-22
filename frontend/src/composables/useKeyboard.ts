import { onMounted, onUnmounted } from 'vue';

export const useKeyboard = (onkeydown: (e: KeyboardEvent) => void, onkeyup: (e: KeyboardEvent) => void) => {
  onMounted(() => {
    window.addEventListener('keydown', onkeydown);
    window.addEventListener('keyup', onkeyup);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', onkeydown);
    window.removeEventListener('keyup', onkeyup);
  });
  return {};
};
