import type {
  ArrowElement,
  EllipseElement,
  FreeDrawElement,
  LineElement,
  Point,
  RectangleElement,
  TextElement,
} from "../types/canvas.types";

const createBaseValues = () => {
  const now = Date.now();

  return {
    rotation: 0,

    strokeColor: "#000000",

    backgroundColor: "transparent",

    strokeWidth: 2,

    createdAt: now,

    updatedAt: now,
  };
};

export const createRectangleElement = (
  start: Point,
  end: Point,
): RectangleElement => {
  const x = Math.min(start.x, end.x);

  const y = Math.min(start.y, end.y);

  const width = Math.abs(end.x - start.x);

  const height = Math.abs(end.y - start.y);

  return {
    id: crypto.randomUUID(),

    type: "rectangle",

    x,

    y,

    width,

    height,

    ...createBaseValues(),
  };
};

export const createEllipseElement = (
  start: Point,
  end: Point,
): EllipseElement => {
  const x = Math.min(start.x, end.x);

  const y = Math.min(start.y, end.y);

  const width = Math.abs(end.x - start.x);

  const height = Math.abs(end.y - start.y);

  return {
    id: crypto.randomUUID(),

    type: "ellipse",

    x,

    y,

    width,

    height,

    ...createBaseValues(),
  };
};

export const createLineElement = (start: Point, end: Point): LineElement => {
  const x = Math.min(start.x, end.x);

  const y = Math.min(start.y, end.y);

  const width = Math.abs(end.x - start.x);

  const height = Math.abs(end.y - start.y);

  return {
    id: crypto.randomUUID(),

    type: "line",

    x,

    y,

    width,

    height,

    points: [start, end],

    ...createBaseValues(),
  };
};

export const createArrowElement = (start: Point, end: Point): ArrowElement => {
  const x = Math.min(start.x, end.x);

  const y = Math.min(start.y, end.y);

  const width = Math.abs(end.x - start.x);

  const height = Math.abs(end.y - start.y);

  return {
    id: crypto.randomUUID(),

    type: "arrow",

    x,
    y,

    width,
    height,

    points: [start, end],

    ...createBaseValues(),
  };
};

export const createFreeDrawElement = (points: Point[]): FreeDrawElement => {
  if (points.length === 0) {
    throw new Error("FreeDraw requires at least one point");
  }

  const xs = points.map((point) => point.x);

  const ys = points.map((point) => point.y);

  const x = Math.min(...xs);

  const y = Math.min(...ys);

  const maxX = Math.max(...xs);

  const maxY = Math.max(...ys);

  return {
    id: crypto.randomUUID(),

    type: "freedraw",

    x,
    y,

    width: maxX - x,

    height: maxY - y,

    points,

    ...createBaseValues(),
  };
};

export const createTextElement = (point: Point, text: string): TextElement => {
  const now = Date.now();

  const fontSize = 24;

  return {
    id: crypto.randomUUID(),

    type: "text",

    x: point.x,
    y: point.y,

    width: Math.max(text.length * fontSize * 0.55, 20),

    height: fontSize * 1.4,

    text,

    fontSize,

    fontFamily: "Arial, sans-serif",

    rotation: 0,

    strokeColor: "#000000",

    backgroundColor: "transparent",

    strokeWidth: 0,

    createdAt: now,

    updatedAt: now,
  };
};
