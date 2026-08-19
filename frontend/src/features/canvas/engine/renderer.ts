import type {
  Camera,
  CanvasElement,
  RectangleElement,
  EllipseElement,
  LineElement,
  ArrowElement,
  TextElement,
  FreeDrawElement,
} from "../types/canvas.types";

import { worldToScreen } from "./coordinates";

import { getHandlePositions, getRotationHandlePosition, getElementBounds } from "./selection";



export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): void => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const applyElementRotation = (
  ctx: CanvasRenderingContext2D,
  element: { x: number; y: number; width: number; height: number; rotation: number },
  camera: Camera,
): void => {
  if (!element.rotation) return;

  const cx = worldToScreen({ x: element.x + element.width / 2, y: element.y + element.height / 2 }, camera);
  ctx.translate(cx.x, cx.y);
  ctx.rotate(element.rotation);
  ctx.translate(-cx.x, -cx.y);
};



export const renderElements = (
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  camera: Camera,
  draftElement?: CanvasElement | null,
): void => {
  for (const element of elements) {
    renderElement(ctx, element, camera);
  }

  if (draftElement) {
    renderElement(ctx, draftElement, camera);
  }
};

export const renderElement = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
  switch (element.type) {
    case "rectangle":
      renderRectangle(ctx, element, camera);
      break;

    case "ellipse":
      renderEllipse(ctx, element, camera);
      break;

    case "line":
      renderLine(ctx, element, camera);
      break;

    case "arrow":
      renderArrow(ctx, element, camera);
      break;

    case "freedraw":
      renderFreeDraw(ctx, element, camera);
      break;

    case "text":
      renderText(ctx, element, camera);
      break;
  }
};


const renderRectangle = (
  ctx: CanvasRenderingContext2D,
  element: RectangleElement,
  camera: Camera,
): void => {
  const position = worldToScreen({ x: element.x, y: element.y }, camera);
  const w = element.width * camera.zoom;
  const h = element.height * camera.zoom;

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  applyElementRotation(ctx, element, camera);

  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth * camera.zoom;
  ctx.fillStyle = element.backgroundColor;

  if (element.backgroundColor !== "transparent") {
    ctx.fillRect(position.x, position.y, w, h);
  }
  ctx.strokeRect(position.x, position.y, w, h);

  ctx.restore();
};

const renderEllipse = (
  ctx: CanvasRenderingContext2D,
  element: EllipseElement,
  camera: Camera,
): void => {
  const position = worldToScreen({ x: element.x, y: element.y }, camera);
  const radiusX = (element.width * camera.zoom) / 2;
  const radiusY = (element.height * camera.zoom) / 2;
  const centerX = position.x + radiusX;
  const centerY = position.y + radiusY;

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  applyElementRotation(ctx, element, camera);

  ctx.fillStyle = element.backgroundColor;
  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth * camera.zoom;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

  if (element.backgroundColor !== "transparent") {
    ctx.fill();
  }
  ctx.stroke();

  ctx.restore();
};

const renderLine = (
  ctx: CanvasRenderingContext2D,
  element: LineElement | ArrowElement,
  camera: Camera,
): void => {
  if (element.points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth * camera.zoom;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const firstPoint = worldToScreen(element.points[0], camera);
  ctx.moveTo(firstPoint.x, firstPoint.y);

  for (const point of element.points.slice(1)) {
    const screenPoint = worldToScreen(point, camera);
    ctx.lineTo(screenPoint.x, screenPoint.y);
  }

  ctx.stroke();
  ctx.restore();
};

const renderArrow = (
  ctx: CanvasRenderingContext2D,
  element: ArrowElement,
  camera: Camera,
): void => {
  if (element.points.length < 2) return;

  const start = worldToScreen(element.points[0], camera);
  const end = worldToScreen(element.points[element.points.length - 1], camera);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const arrowLength = 12 * camera.zoom;
  const arrowAngle = Math.PI / 7;

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  ctx.strokeStyle = element.strokeColor;
  ctx.fillStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth * camera.zoom;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - arrowLength * Math.cos(angle - arrowAngle),
    end.y - arrowLength * Math.sin(angle - arrowAngle),
  );
  ctx.lineTo(
    end.x - arrowLength * Math.cos(angle + arrowAngle),
    end.y - arrowLength * Math.sin(angle + arrowAngle),
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};

const renderText = (
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  camera: Camera,
): void => {
  const position = worldToScreen({ x: element.x, y: element.y }, camera);

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  applyElementRotation(ctx, element, camera);

  ctx.fillStyle = element.strokeColor;
  ctx.font = `${element.fontSize * camera.zoom}px ${element.fontFamily}`;
  ctx.textBaseline = "top";

  const lines = element.text.split("\n");
  const lineHeight = element.fontSize * 1.3 * camera.zoom;

  lines.forEach((line, index) => {
    ctx.fillText(line, position.x, position.y + index * lineHeight);
  });

  ctx.restore();
};

const renderFreeDraw = (
  ctx: CanvasRenderingContext2D,
  element: FreeDrawElement,
  camera: Camera,
): void => {
  if (element.points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth * camera.zoom;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  const first = worldToScreen(element.points[0], camera);
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < element.points.length - 1; i++) {
    const current = worldToScreen(element.points[i], camera);
    const next = worldToScreen(element.points[i + 1], camera);
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const last = worldToScreen(element.points[element.points.length - 1], camera);
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  ctx.restore();
};



export const renderSelection = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
  const bounds = getElementBounds(element);

  const topLeft = worldToScreen({ x: bounds.x, y: bounds.y }, camera);
  const bottomRight = worldToScreen(
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    camera,
  );

  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;

  // Compute centre in screen space for rotation pivot
  const cx = topLeft.x + width / 2;
  const cy = topLeft.y + height / 2;

  ctx.save();

  // Rotate the entire selection box to match the element
  if (element.rotation) {
    ctx.translate(cx, cy);
    ctx.rotate(element.rotation);
    ctx.translate(-cx, -cy);
  }

  // Selection border
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(topLeft.x - 4, topLeft.y - 4, width + 8, height + 8);
  ctx.setLineDash([]);

  // Resize handles
  const handles = getHandlePositions(bounds);
  const handleSize = 8;

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1.5;

  for (const point of Object.values(handles)) {
    const screenPoint = worldToScreen(point, camera);
    ctx.fillRect(
      screenPoint.x - handleSize / 2,
      screenPoint.y - handleSize / 2,
      handleSize,
      handleSize,
    );
    ctx.strokeRect(
      screenPoint.x - handleSize / 2,
      screenPoint.y - handleSize / 2,
      handleSize,
      handleSize,
    );
  }

  // Rotation handle
  const rotationPoint = getRotationHandlePosition(bounds);
  const rotationScreen = worldToScreen(rotationPoint, camera);
  const topCenter = worldToScreen(
    { x: bounds.x + bounds.width / 2, y: bounds.y },
    camera,
  );

  // Line from top-center to rotation handle
  ctx.beginPath();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1;
  ctx.moveTo(topCenter.x, topCenter.y - 4);
  ctx.lineTo(rotationScreen.x, rotationScreen.y);
  ctx.stroke();

  // Rotation handle circle
  ctx.beginPath();
  ctx.arc(rotationScreen.x, rotationScreen.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#2563eb";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
};
