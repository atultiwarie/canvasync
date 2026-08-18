import type {
  EllipseElement,
  LineElement,
  Point,
  RectangleElement,
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
