/** Configurable gesture sensitivity for the zoomable image viewer. */

/** Minimum pointer travel (px) before a drag is treated as a pan. */
export const DEFAULT_DRAG_THRESHOLD = 6;

let dragThreshold = DEFAULT_DRAG_THRESHOLD;

export function setDragThreshold(px: number) {
  dragThreshold = Math.max(0, px);
}

export function getDragThreshold() {
  return dragThreshold;
}

/** True once the pointer has moved far enough to count as an intentional pan. */
export function exceedsDragThreshold(
  dx: number,
  dy: number,
  threshold: number = dragThreshold,
) {
  return Math.hypot(dx, dy) >= threshold;
}

/** Pan is only possible when pan mode is on and the image is zoomed in. */
export function canPan(panMode: boolean, scale: number) {
  return panMode && scale > 1;
}
