import type { Point } from "../types/canvas.types";

export type ResizeHandle =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left";

export type SelectionInteraction =
  | {
      type: "none";
    }
  | {
      type: "resize";

      elementId: string;

      handle: ResizeHandle;

      startMouse: {
        x: number;
        y: number;
      };

      startBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      };

      startPoints: Point[] | null;
    }
  | {
      type: "rotate";

      elementId: string;

      startMouse: {
        x: number;
        y: number;
      };

      center: {
        x: number;
        y: number;
      };

      startRotation: number;
    };
