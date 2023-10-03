import { ref, type Ref } from 'vue';

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function touchdist(p1: PointerEvent, p2: PointerEvent) {
  return dist(p1.clientX, p1.clientY, p2.clientX, p2.clientY);
}

type PointerData = {
  evfirst: PointerEvent;
  evlast: PointerEvent;
};

export const useCanvasTouchGesture = (
  canvasCenterX: Ref<number>,
  canvasCenterY: Ref<number>,
  canvasScale: Ref<number>
) => {
  const fingertouches = ref(new Map<number, PointerData>());
  const canvasScrollBaseX = ref(0);
  const canvasScrollBaseY = ref(0);
  const canvasZoomBaseScale = ref(1);
  const canvasBaseTouch = ref<Array<PointerEvent> | null>(null);

  function finger1setup() {
    canvasScrollBaseX.value = canvasCenterX.value;
    canvasScrollBaseY.value = canvasCenterY.value;
    canvasBaseTouch.value = Array.from(fingertouches.value).map((touch) => touch[1].evlast);
  }

  function finger2setup() {
    canvasScrollBaseX.value = canvasCenterX.value;
    canvasScrollBaseY.value = canvasCenterY.value;
    canvasZoomBaseScale.value = canvasScale.value;
    canvasBaseTouch.value = Array.from(fingertouches.value).map((touch) => touch[1].evlast);
  }

  function onfingerdown(e: PointerEvent) {
    fingertouches.value.set(e.pointerId, {
      evfirst: e,
      evlast: e
    });
    if (fingertouches.value.size == 1) {
      finger1setup();
    } else if (fingertouches.value.size == 2) {
      finger2setup();
    }
  }
  function onfingermove(e: PointerEvent) {
    const touch = fingertouches.value.get(e.pointerId);
    if (!touch) return;

    if (fingertouches.value.size == 1 && canvasBaseTouch.value) {
      canvasCenterX.value = canvasScrollBaseX.value + e.clientX - canvasBaseTouch.value[0].clientX;
      canvasCenterY.value = canvasScrollBaseY.value + e.clientY - canvasBaseTouch.value[0].clientY;
    } else if (fingertouches.value.size == 2 && canvasBaseTouch.value) {
      const touches = Array.from(fingertouches.value).map((touch) => touch[1].evlast);

      const scalediff =
        touchdist(touches[0], touches[1]) /
        touchdist(canvasBaseTouch.value[0], canvasBaseTouch.value[1]);

      const touchCenterX = (touches[0].clientX + touches[1].clientX) / 2;
      const baseTouchCenterX =
        (canvasBaseTouch.value[0].clientX + canvasBaseTouch.value[1].clientX) / 2;
      const touchCenterY = (touches[0].clientY + touches[1].clientY) / 2;
      const baseTouchCenterY =
        (canvasBaseTouch.value[0].clientY + canvasBaseTouch.value[1].clientY) / 2;
      canvasCenterX.value = touchCenterX + (canvasScrollBaseX.value - baseTouchCenterX) * scalediff;
      canvasCenterY.value = touchCenterY + (canvasScrollBaseY.value - baseTouchCenterY) * scalediff;
      canvasScale.value = canvasZoomBaseScale.value * scalediff;
    }

    touch.evlast = e;
  }
  function onfingerup(e: PointerEvent) {
    fingertouches.value.delete(e.pointerId);
    if (fingertouches.value.size == 1) {
      finger1setup();
    } else if (fingertouches.value.size == 2) {
      finger2setup();
    }
  }

  return { onfingerdown, onfingermove, onfingerup };
};
