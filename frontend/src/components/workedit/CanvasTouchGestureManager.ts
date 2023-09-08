import type { Ref } from 'vue';

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

export class CanvasTouchGestureManager {
  constructor(canvasCenterX: Ref<number>, canvasCenterY: Ref<number>, canvasScale: Ref<number>) {
    this.canvasCenterX = canvasCenterX;
    this.canvasCenterY = canvasCenterY;
    this.canvasScale = canvasScale;

    this.fingertouches = new Map<number, PointerData>();
    this.canvasScrollBaseX = 0;
    this.canvasScrollBaseY = 0;
    this.canvasZoomBaseScale = 1;
    this.canvasBaseTouch = null;
  }

  canvasCenterX: Ref<number>;
  canvasCenterY: Ref<number>;
  canvasScale: Ref<number>;

  fingertouches: Map<number, PointerData>;
  canvasScrollBaseX: number;
  canvasScrollBaseY: number;
  canvasZoomBaseScale: number;
  canvasBaseTouch: Array<PointerEvent> | null;

  finger1setup() {
    this.canvasScrollBaseX = this.canvasCenterX.value;
    this.canvasScrollBaseY = this.canvasCenterY.value;
    this.canvasBaseTouch = Array.from(this.fingertouches).map((touch) => touch[1].evlast);
  }

  finger2setup() {
    this.canvasScrollBaseX = this.canvasCenterX.value;
    this.canvasScrollBaseY = this.canvasCenterY.value;
    this.canvasZoomBaseScale = this.canvasScale.value;
    this.canvasBaseTouch = Array.from(this.fingertouches).map((touch) => touch[1].evlast);
  }

  onfingerdown(e: PointerEvent) {
    this.fingertouches.set(e.pointerId, {
      evfirst: e,
      evlast: e
    });
    if (this.fingertouches.size == 1) {
      this.finger1setup();
    } else if (this.fingertouches.size == 2) {
      this.finger2setup();
    }
  }
  onfingermove(e: PointerEvent) {
    const touch = this.fingertouches.get(e.pointerId);
    if (!touch) return;

    if (this.fingertouches.size == 1 && this.canvasBaseTouch) {
      this.canvasCenterX.value =
        this.canvasScrollBaseX + e.clientX - this.canvasBaseTouch[0].clientX;
      this.canvasCenterY.value =
        this.canvasScrollBaseY + e.clientY - this.canvasBaseTouch[0].clientY;
    } else if (this.fingertouches.size == 2 && this.canvasBaseTouch) {
      const touches = Array.from(this.fingertouches).map((touch) => touch[1].evlast);

      const scalediff =
        touchdist(touches[0], touches[1]) /
        touchdist(this.canvasBaseTouch[0], this.canvasBaseTouch[1]);

      const touchCenterX = (touches[0].clientX + touches[1].clientX) / 2;
      const baseTouchCenterX = (this.canvasBaseTouch[0].clientX + this.canvasBaseTouch[1].clientX) / 2;
      const touchCenterY = (touches[0].clientY + touches[1].clientY) / 2;
      const baseTouchCenterY = (this.canvasBaseTouch[0].clientY + this.canvasBaseTouch[1].clientY) / 2;
      this.canvasCenterX.value = touchCenterX + (this.canvasScrollBaseX - baseTouchCenterX) * scalediff;
      this.canvasCenterY.value = touchCenterY + (this.canvasScrollBaseY - baseTouchCenterY) * scalediff;
      this.canvasScale.value = this.canvasZoomBaseScale * scalediff;
    }

    touch.evlast = e;
  }
  onfingerup(e: PointerEvent) {
    this.fingertouches.delete(e.pointerId);
    if (this.fingertouches.size == 1) {
      this.finger1setup();
    } else if (this.fingertouches.size == 2) {
      this.finger2setup();
    }
  }
}
