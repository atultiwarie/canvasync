import type { Point, RectangleElement } from "../types/canvas.types";

export const createRectangleElement = (
  start: Point,
  end: Point,
): RectangleElement => {
  const x = Math.min(start.x, end.x);

  const y = Math.min(start.y, end.y);

  const width = Math.abs(end.x - start.x);

  const height = Math.abs(end.y - start.y);

  const now = Date.now();

  return {
    id: crypto.randomUUID(),

    type: "rectangle",

    x,
    y,

    width,
    height,

    rotation: 0,

    strokeColor: "#000000",

    backgroundColor: "transparent",

    strokeWidth: 2,

    createdAt: now,
    updatedAt: now,
  };
};
