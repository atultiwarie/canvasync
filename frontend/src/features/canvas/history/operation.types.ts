import type {
  CanvasElement
} from "../types/canvas.types";

export type CreateOperation = {
  type: "create";

  element: CanvasElement;
};

export type UpdateOperation = {
  type: "update";

  elementId: string;

  before: Partial<CanvasElement>;

  after: Partial<CanvasElement>;
};

export type DeleteOperation = {
  type: "delete";

  element: CanvasElement;
};

export type CanvasOperation =
  | CreateOperation
  | UpdateOperation
  | DeleteOperation;