import type { Point } from "../types/canvas.types";

export type InteractionState =
  | {
      type: "idle";
    }
  | {
      type: "drawing";

      start: Point;

      points: Point[];
    }
  | {
      type: "dragging";

      elementId: string;

      mouseStart: Point;

      elementStart: Point;

      startPoints?: Point[] | null;

      lastPosition: Point;
    }
  | {
      type: "panning";

      screenStart: Point;

      cameraStart: {
        x: number;
        y: number;
        zoom: number;
      };
    }
  | {
      type: "text";

      position: Point;
    };
