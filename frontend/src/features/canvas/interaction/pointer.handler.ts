import { useRef } from "react";
import type { PointerEvent, WheelEvent } from "react";

import { screenToWorld } from "../engine/coordinates";
import {
  createArrowElement,
  createEllipseElement,
  createFreeDrawElement,
  createLineElement,
  createRectangleElement,
} from "../engine/element.factory";

import { findElementAtPoint } from "../engine/hitTest";

import { useCanvasStore } from "../state/canvas.store";

import type { Point } from "../types/canvas.types";

import type { InteractionState } from "./interaction.types";

export const useCanvasPointerHandlers = (
  onTextStart?: (worldPoint: Point, screenPoint: Point) => void,
) => {
  const interaction = useRef<InteractionState>({
    type: "idle",
  });

  const getState = () => useCanvasStore.getState();

  const getScreenPoint = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = event.currentTarget;

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,

      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const { activeTool, camera, elements } = getState();

    if (event.button === 2) {
      return;
    }

    if (activeTool === "hand" || event.button === 1) {
      const screenPoint = getScreenPoint(event);

      interaction.current = {
        type: "panning",

        screenStart: screenPoint,

        cameraStart: {
          x: camera.x,
          y: camera.y,
          zoom: camera.zoom,
        },
      };

      event.currentTarget.setPointerCapture(event.pointerId);

      return;
    }

    const screenPoint = getScreenPoint(event);

    const worldPoint = screenToWorld(screenPoint, camera);

    if (activeTool === "text") {
      onTextStart?.(worldPoint, screenPoint);

      interaction.current = {
        type: "text",

        position: worldPoint,
      };

      return;
    }

    if (activeTool === "select") {
      const element = findElementAtPoint(worldPoint, elements);

      if (!element) {
        getState().selectElement(null);

        interaction.current = {
          type: "idle",
        };

        return;
      }

      getState().selectElement(element.id);

      interaction.current = {
        type: "dragging",

        elementId: element.id,

        mouseStart: worldPoint,

        elementStart: {
          x: element.x,
          y: element.y,
        },
      };

      event.currentTarget.setPointerCapture(event.pointerId);

      return;
    }

    if (
      activeTool === "rectangle" ||
      activeTool === "ellipse" ||
      activeTool === "line" ||
      activeTool === "arrow" ||
      activeTool === "freedraw"
    ) {
      interaction.current = {
        type: "drawing",
        start: worldPoint,
        points: [worldPoint],
      };

      return;
    }

    interaction.current = {
      type: "idle",
    };
  };

  const createDrawingElement = (start: Point, end: Point, points?: Point[]) => {
    const { activeTool } = getState();

    switch (activeTool) {
      case "rectangle":
        return createRectangleElement(start, end);

      case "ellipse":
        return createEllipseElement(start, end);

      case "line":
        return createLineElement(start, end);

      case "arrow":
        return createArrowElement(start, end);

      case "freedraw":
        return createFreeDrawElement(points ?? [start, end]);

      default:
        return null;
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const { camera, setCamera, updateElement, setDraftElement } = getState();

    const state = interaction.current;

    if (state.type === "idle") {
      return;
    }

    if (state.type === "panning") {
      const currentScreen = getScreenPoint(event);

      const deltaX = currentScreen.x - state.screenStart.x;

      const deltaY = currentScreen.y - state.screenStart.y;

      setCamera({
        x: state.cameraStart.x - deltaX / state.cameraStart.zoom,

        y: state.cameraStart.y - deltaY / state.cameraStart.zoom,

        zoom: state.cameraStart.zoom,
      });

      return;
    }

    if (state.type === "dragging") {
      const screenPoint = getScreenPoint(event);

      const worldPoint = screenToWorld(screenPoint, camera);

      const deltaX = worldPoint.x - state.mouseStart.x;

      const deltaY = worldPoint.y - state.mouseStart.y;

      updateElement(state.elementId, {
        x: state.elementStart.x + deltaX,

        y: state.elementStart.y + deltaY,
      });

      return;
    }

    if (state.type === "drawing") {
      const screenPoint = getScreenPoint(event);

      const worldPoint = screenToWorld(screenPoint, camera);

      if (getState().activeTool === "freedraw") {
        const lastPoint = state.points[state.points.length - 1];

        const distance = Math.hypot(
          worldPoint.x - lastPoint.x,

          worldPoint.y - lastPoint.y,
        );

        if (distance >= 2) {
          state.points.push(worldPoint);
        }

        const draft = createFreeDrawElement(state.points);

        setDraftElement(draft);

        return;
      }

      const draft = createDrawingElement(state.start, worldPoint);

      setDraftElement(draft);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const state = interaction.current;

    if (state.type === "idle") {
      return;
    }

    if (state.type === "panning") {
      releasePointerCapture(event);

      interaction.current = {
        type: "idle",
      };

      return;
    }

    if (state.type === "dragging") {
      releasePointerCapture(event);

      interaction.current = {
        type: "idle",
      };

      return;
    }

    if (state.type === "drawing") {
      const { camera, addElement, setDraftElement } = getState();

      const screenPoint = getScreenPoint(event);

      const worldPoint = screenToWorld(screenPoint, camera);

      const activeTool = getState().activeTool;

      let element;

      if (activeTool === "freedraw") {
        state.points.push(worldPoint);

        element = createFreeDrawElement(state.points);
      } else {
        element = createDrawingElement(state.start, worldPoint);
      }

      if (element) {
        let isValid = false;

        if (element.type === "line" || element.type === "arrow") {
          isValid = element.width >= 2 || element.height >= 2;
        } else if (element.type === "freedraw") {
          isValid = element.points.length >= 2;
        } else {
          isValid = element.width >= 2 && element.height >= 2;
        }

        if (isValid) {
          addElement(element);
        }
      }

      setDraftElement(null);

      interaction.current = {
        type: "idle",
      };

      return;
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLCanvasElement>) => {
    releasePointerCapture(event);

    interaction.current = {
      type: "idle",
    };

    getState().setDraftElement(null);
  };

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const { camera, setCamera } = getState();

    const canvas = event.currentTarget;

    const rect = canvas.getBoundingClientRect();

    const mouseScreen: Point = {
      x: event.clientX - rect.left,

      y: event.clientY - rect.top,
    };

    const mouseWorldBefore = screenToWorld(mouseScreen, camera);

    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

    const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.1), 5);

    const newCameraX = mouseWorldBefore.x - mouseScreen.x / newZoom;

    const newCameraY = mouseWorldBefore.y - mouseScreen.y / newZoom;

    setCamera({
      x: newCameraX,
      y: newCameraY,
      zoom: newZoom,
    });
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleWheel,
  };
};

const releasePointerCapture = (event: PointerEvent<HTMLCanvasElement>) => {
  const canvas = event.currentTarget;

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
};
