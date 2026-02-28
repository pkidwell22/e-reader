/**
 * Zoom state management for image viewing.
 * Handles scale, pan, pinch-zoom, and scroll-wheel zoom.
 */

export interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

export const DEFAULT_ZOOM: ZoomState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.2;

export function zoomIn(state: ZoomState): ZoomState {
  return {
    ...state,
    scale: Math.min(state.scale + ZOOM_STEP, MAX_SCALE),
  };
}

export function zoomOut(state: ZoomState): ZoomState {
  const newScale = Math.max(state.scale - ZOOM_STEP, MIN_SCALE);
  return {
    scale: newScale,
    // Clamp pan when zooming out
    translateX: newScale <= 1 ? 0 : state.translateX,
    translateY: newScale <= 1 ? 0 : state.translateY,
  };
}

export function resetZoom(): ZoomState {
  return { ...DEFAULT_ZOOM };
}

export function handleWheelZoom(
  state: ZoomState,
  deltaY: number,
  clientX: number,
  clientY: number,
  containerRect: DOMRect
): ZoomState {
  const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.scale * zoomFactor));

  // Zoom toward cursor position
  const offsetX = clientX - containerRect.left - containerRect.width / 2;
  const offsetY = clientY - containerRect.top - containerRect.height / 2;

  const scaleChange = newScale / state.scale;
  const newTranslateX = state.translateX * scaleChange - offsetX * (scaleChange - 1);
  const newTranslateY = state.translateY * scaleChange - offsetY * (scaleChange - 1);

  return {
    scale: newScale,
    translateX: newScale <= 1 ? 0 : newTranslateX,
    translateY: newScale <= 1 ? 0 : newTranslateY,
  };
}

export function handlePan(
  state: ZoomState,
  deltaX: number,
  deltaY: number
): ZoomState {
  if (state.scale <= 1) return state;

  return {
    ...state,
    translateX: state.translateX + deltaX,
    translateY: state.translateY + deltaY,
  };
}
