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

export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): void => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    case "text":
      renderText(ctx, element, camera);
      break;
    case "freedraw":
      renderFreeDraw(ctx, element, camera);
      break;
  }
};

const renderRectangle = (
  ctx: CanvasRenderingContext2D,
  element: RectangleElement,
  camera: Camera,
): void => {
  const position = worldToScreen(
    {
      x: element.x,
      y: element.y,
    },
    camera,
  );
  ctx.save();

  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth * camera.zoom;
  ctx.fillStyle = element.backgroundColor;

  ctx.fillRect(
    position.x,
    position.y,
    element.width * camera.zoom,
    element.height * camera.zoom,
  );
  ctx.strokeRect(
    position.x,
    position.y,
    element.width * camera.zoom,
    element.height * camera.zoom,
  );
  ctx.restore();
};

const renderEllipse = (
  ctx: CanvasRenderingContext2D,
  element: EllipseElement,
  camera: Camera,
): void => {
  const position = worldToScreen(
    {
      x: element.x,
      y: element.y,
    },
    camera,
  );

  const centerX = position.x + (element.width * camera.zoom) / 2;

  const centerY = position.y + (element.height * camera.zoom) / 2;

  const radiusX = (element.width * camera.zoom) / 2;

  const radiusY = (element.height * camera.zoom) / 2;

  ctx.save();

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
  if (element.points.length < 2) {
    return;
  }

  ctx.save();

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
  renderLine(ctx, element, camera);
};

const renderText = (
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  camera: Camera,
): void => {
  const position = worldToScreen(
    {
      x: element.x,
      y: element.y,
    },
    camera,
  );

  ctx.save();
  ctx.fillStyle = element.strokeColor;
  ctx.font = `${element.fontSize * camera.zoom}px ${element.fontFamily}`;
  ctx.fillText(element.text, position.x, position.y);
  ctx.restore();
};

const renderFreeDraw = (
  ctx: CanvasRenderingContext2D,
  element: FreeDrawElement,
  camera: Camera,
): void => {
  if (element.points.length < 2) {
    return;
  }

  ctx.save();
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

export const renderSelection = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
  const position = worldToScreen(
    {
      x: element.x,
      y: element.y,
    },
    camera,
  );

  const width = element.width * camera.zoom;

  const height = element.height * camera.zoom;

  ctx.save();

  ctx.strokeStyle = "#2563eb";

  ctx.lineWidth = 1;

  ctx.setLineDash([5, 5]);

  ctx.strokeRect(position.x - 4, position.y - 4, width + 8, height + 8);

  ctx.setLineDash([]);

  ctx.restore();
};
