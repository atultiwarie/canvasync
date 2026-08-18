import type {
  CanvasElement,
  RectangleElement,
  EllipseElement,
  LineElement,
  ArrowElement,
  TextElement,
  FreeDrawElement,
  Point,
} from "../types/canvas.types";

const isPointInsideRectangle = (
  point: Point,
  element: RectangleElement | TextElement,
): boolean => {
  return (
    point.x >= element.x &&
    point.x <= element.x + element.width &&
    point.y >= element.y &&
    point.y <= element.y + element.height
  );
};

const isPointInsideEllipse = (
  point: Point,
  element: EllipseElement,
): boolean => {
  const centerX = element.x + element.width / 2;

  const centerY = element.y + element.height / 2;

  const radiusX = element.width / 2;

  const radiusY = element.height / 2;

  if (radiusX === 0 || radiusY === 0) {
    return false;
  }

  const normalizedX = (point.x - centerX) / radiusX;

  const normalizedY = (point.y - centerY) / radiusY;

  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
};

const distanceToSegment = (point: Point, start: Point, end: Point): number => {
  const dx = end.x - start.x;

  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        (dx * dx + dy * dy),
    ),
  );

  const closestX = start.x + t * dx;

  const closestY = start.y + t * dy;

  return Math.hypot(point.x - closestX, point.y - closestY);
};

const isPointNearLine = (
  point: Point,
  element: LineElement | ArrowElement | FreeDrawElement,
): boolean => {
  if (element.points.length < 2) {
    return false;
  }

  const threshold = 8;

  for (let i = 0; i < element.points.length - 1; i++) {
    const distance = distanceToSegment(
      point,
      element.points[i],
      element.points[i + 1],
    );

    if (distance <= threshold) {
      return true;
    }
  }

  return false;
};

export const findElementAtPoint = (
  point: Point,
  elements: CanvasElement[],
): CanvasElement | null => {
  /*
   * Search backwards so the most
   * recently created element is
   * selected first.
   */

  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];

    switch (element.type) {
      case "rectangle":
        if (isPointInsideRectangle(point, element)) {
          return element;
        }

        break;

      case "ellipse":
        if (isPointInsideEllipse(point, element)) {
          return element;
        }

        break;

      case "line":
      case "arrow":
      case "freedraw":
        if (isPointNearLine(point, element)) {
          return element;
        }

        break;

      case "text":
        if (isPointInsideRectangle(point, element)) {
          return element;
        }

        break;
    }
  }

  return null;
};
