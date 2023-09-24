import { computed, ref, type Ref } from 'vue';
import { useKeyboard } from './useKeyboard';
import { useResize } from './useResize';
import { CanvasTouchGestureManager } from '@/components/workedit/CanvasTouchGestureManager';

export const useCanvasSizing = () => {
  const initialScale = 0.25;

  const windowWidth = ref(window.innerWidth);
  const windowHeight = ref(window.innerHeight);
  const canvasWidth = ref(1240); // A4, 150dpi
  const canvasHeight = ref(1754);

  const canvasCenterX = ref(windowWidth.value / 2);
  const canvasCenterY = ref(windowHeight.value / 2);
  const canvasScale = ref(initialScale);

  function initView() {
    canvasCenterX.value = windowWidth.value / 2;
    canvasCenterY.value = windowHeight.value / 2;
    canvasScale.value = initialScale;
  }

  function onresize() {
    windowWidth.value = window.innerWidth;
    windowHeight.value = window.innerHeight;
    initView();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.code == 'KeyF') initView();
  }
  function onkeyup(e: KeyboardEvent) {}

  useKeyboard(onkeydown, onkeyup);
  useResize(onresize);

  const canvasStyle = computed(() => {
    return {
      left: 0,
      top: 0,
      transformOrigin: 'top left',
      transform: `translate(${
        canvasCenterX.value + (-canvasWidth.value * canvasScale.value) / 2
      }px, ${canvasCenterY.value + (-canvasHeight.value * canvasScale.value) / 2}px) scale(${
        canvasScale.value
      })`
    };
  });

  const touchManager = new CanvasTouchGestureManager(canvasCenterX, canvasCenterY, canvasScale);
  const wheelZoom = (e: WheelEvent) => {
    const minScale = 1 / 50;

    const deltaScale = 0.02;
    const beforeScale = canvasScale.value;
    const afterScale = Math.max(minScale, canvasScale.value * Math.exp(-e.deltaY * deltaScale));

    canvasCenterX.value =
      e.clientX + ((canvasCenterX.value - e.clientX) * afterScale) / beforeScale;
    canvasCenterY.value =
      e.clientY + ((canvasCenterY.value - e.clientY) * afterScale) / beforeScale;
    canvasScale.value = afterScale;
  };
  const wheelScroll = (e: WheelEvent) => {
    const deltaScale = 0.3;
    canvasCenterX.value -= e.deltaX * deltaScale;
    canvasCenterY.value -= e.deltaY * deltaScale;
  };
  const onwheel = (e: WheelEvent) => {
    if (e.ctrlKey) wheelZoom(e);
    else wheelScroll(e);
    e.preventDefault();
  };

  function clientToCanvas(cliX: number, cliY: number) {
    const x = canvasWidth.value / 2 + (cliX - canvasCenterX.value) / canvasScale.value;
    const y = canvasHeight.value / 2 + (cliY - canvasCenterY.value) / canvasScale.value;
    return { x, y };
  }

  function getCanvasScale() {
    return canvasScale.value;
  }

  return {
    canvasStyle,
    touchManager,
    onwheel,
    canvasWidth,
    canvasHeight,
    clientToCanvas,
    initView,
    getCanvasScale
  };
};
