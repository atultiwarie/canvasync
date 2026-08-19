import type { CanvasElement } from "../types/canvas.types";

import type { CanvasOperation } from "./operation.types";

export const applyOperation = (
  elements: CanvasElement[],
  operation: CanvasOperation,
): CanvasElement[] => {
  switch (operation.type) {
    case "create": {
      return [...elements, operation.element];
    }

    case "update": {
      return elements.map((element) => {
        if (element.id !== operation.elementId) {
          return element;
        }

        return {
          ...element,
          ...operation.after,
        } as CanvasElement;
      });
    }

    case "delete": {
      return elements.filter((element) => element.id !== operation.element.id);
    }

    default:
      return elements;
  }
};

export const reverseOperation = (
  operation: CanvasOperation,
): CanvasOperation => {
  switch (operation.type) {
    case "create":
      return {
        type: "delete",

        element: operation.element,
      };

    case "delete":
      return {
        type: "create",

        element: operation.element,
      };

    case "update":
      return {
        type: "update",

        elementId: operation.elementId,

        before: operation.after,

        after: operation.before,
      };
  }
};