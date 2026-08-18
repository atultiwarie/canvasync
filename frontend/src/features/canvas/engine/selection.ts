import type { Camera, CanvasElement, Point } from "../types/canvas.types";
import type { ResizeHandle } from "../interaction/selection.types";

export type SelectionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const getElementBounds = (element: CanvasElement): SelectionBounds => {
  if ("points" in element && element.points && element.points.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of element.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 10),
      height: Math.max(maxY - minY, 10),
    };
  }

  const minX = Math.min(element.x, element.x + element.width);
  const minY = Math.min(element.y, element.y + element.height);
  const width = Math.abs(element.width);
  const height = Math.abs(element.height);

  return {
    x: minX,
    y: minY,
    width: Math.max(width, 10),
    height: Math.max(height, 10),
  };
};

export const getHandlePositions = (
  bounds: SelectionBounds,
): Record<ResizeHandle, Point> => {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  return {
    "top-left": { x: left, y: top },
    top: { x: centerX, y: top },
    "top-right": { x: right, y: top },
    right: { x: right, y: centerY },
    "bottom-right": { x: right, y: bottom },
    bottom: { x: centerX, y: bottom },
    "bottom-left": { x: left, y: bottom },
    left: { x: left, y: centerY },
  };
};

export const getRotationHandlePosition = (bounds: SelectionBounds): Point => {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y - 25,
  };
};

export const screenToWorldDistance = (
  distance: number,
  camera: Camera,
): number => {
  return distance / camera.zoom;
};

export const findResizeHandleAtPoint = (
  point: Point,
  element: CanvasElement,
  threshold = 12,
): ResizeHandle | null => {
  const bounds = getElementBounds(element);
  const handles = getHandlePositions(bounds);

  for (const [handle, handlePoint] of Object.entries(handles) as [
    ResizeHandle,
    Point,
  ][]) {
    const distance = Math.hypot(
      point.x - handlePoint.x,
      point.y - handlePoint.y,
    );

    if (distance <= threshold) {
      return handle;
    }
  }

  return null;
};

export const isPointOnRotationHandle = (
  point: Point,
  element: CanvasElement,
  threshold = 12,
): boolean => {
  const rotationPoint = getRotationHandlePosition(getElementBounds(element));
  const distance = Math.hypot(
    point.x - rotationPoint.x,
    point.y - rotationPoint.y,
  );

  return distance <= threshold;
};