import { useRef } from "react";
import type { PointerEvent, WheelEvent } from "react";

import { screenToWorld } from "../engine/coordinates";
import { socketEmitters } from "../../boards/pages/CanvasPage";
import {
  createArrowElement,
  createEllipseElement,
  createFreeDrawElement,
  createLineElement,
  createRectangleElement,
} from "../engine/element.factory";

import {
  findResizeHandleAtPoint,
  isPointOnRotationHandle,
} from "../engine/selection";

import { useHistoryStore } from "../history/history.store";

import type { ResizeHandle, SelectionInteraction } from "./selection.types";

import type { Point } from "../types/canvas.types";

import { findElementAtPoint } from "../engine/hitTest";

import { useCanvasStore } from "../state/canvas.store";

import type { InteractionState } from "./interaction.types";

export const useCanvasPointerHandlers = () => {
  const interaction = useRef<InteractionState>({
    type: "idle",
  });

  const selectionInteraction = useRef<SelectionInteraction>({
    type: "none",
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
      getState().setPendingTextEdit({
        worldPoint,
        initialText: "",
      });

      interaction.current = { type: "idle" };

      return;
    }

    const selectedElementId = getState().selectedElementId;

    const selectedElement = elements.find(
      (element) => element.id === selectedElementId,
    );

    if (activeTool === "select") {
      const element = findElementAtPoint(worldPoint, elements);

      if (selectedElement) {
        const rotationHandle = isPointOnRotationHandle(
          worldPoint,
          selectedElement,
        );

        if (rotationHandle) {
          const center = {
            x: selectedElement.x + selectedElement.width / 2,
            y: selectedElement.y + selectedElement.height / 2,
          };

          selectionInteraction.current = {
            type: "rotate",
            elementId: selectedElement.id,
            startMouse: worldPoint,
            center,
            startRotation: selectedElement.rotation,
          };

          event.currentTarget.setPointerCapture(event.pointerId);
          return;
        }

        const resizeHandle = findResizeHandleAtPoint(
          worldPoint,
          selectedElement,
        );

        if (resizeHandle) {
          selectionInteraction.current = {
            type: "resize",
            elementId: selectedElement.id,
            handle: resizeHandle,
            startMouse: worldPoint,
            startBounds: {
              x: selectedElement.x,
              y: selectedElement.y,
              width: selectedElement.width,
              height: selectedElement.height,
            },
            startPoints: "points" in selectedElement ? [...selectedElement.points] : null,
          };

          event.currentTarget.setPointerCapture(event.pointerId);
          return;
        }
      }

      if (!element) {
        getState().selectElement(null);
        interaction.current = { type: "idle" };
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
        startPoints: "points" in element && element.points ? [...element.points] : null,
        lastPosition: {
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

    // Broadcast cursor position unconditionally on every pointer move
    const moveScreenPoint = getScreenPoint(event);
    const moveWorldPoint = screenToWorld(moveScreenPoint, camera);
    socketEmitters.emitCursor(moveWorldPoint.x, moveWorldPoint.y);

    const state = interaction.current;

    const selectionState = selectionInteraction.current;

    const calculateRotation = (center: Point, mouse: Point): number => {
      return Math.atan2(mouse.y - center.y, mouse.x - center.x);
    };

    if (selectionInteraction.current.type === "rotate") {
      const screenPoint = getScreenPoint(event);

      const worldPoint = screenToWorld(screenPoint, camera);

      const state = selectionInteraction.current;

      const element = getState().elements.find(
        (item) => item.id === state.elementId,
      );

      if (!element) {
        return;
      }

      const currentAngle = calculateRotation(state.center, worldPoint);

      const startAngle = calculateRotation(state.center, state.startMouse);

      const rotation = state.startRotation + (currentAngle - startAngle);

      getState().updateElement(state.elementId, { rotation }, false);
      socketEmitters.emitUpdate(state.elementId, { rotation });

      return;
    }
    if (selectionState.type === "resize") {
      const screenPoint = getScreenPoint(event);

      const worldPoint = screenToWorld(screenPoint, camera);

      const bounds = resizeElement(
        selectionState.handle,
        selectionState.startBounds,
        selectionState.startMouse,
        worldPoint,
      );

      const updates: Record<string, unknown> = { ...bounds };

      if (
        selectionState.startPoints &&
        selectionState.startBounds.width !== 0 &&
        selectionState.startBounds.height !== 0
      ) {
        const scaleX = bounds.width / selectionState.startBounds.width;
        const scaleY = bounds.height / selectionState.startBounds.height;
        const ox = selectionState.startBounds.x;
        const oy = selectionState.startBounds.y;

        updates.points = selectionState.startPoints.map((p) => ({
          x: bounds.x + (p.x - ox) * scaleX,
          y: bounds.y + (p.y - oy) * scaleY,
        }));
      }

      getState().updateElement(
        selectionState.elementId,
        updates as Partial<import("../types/canvas.types").CanvasElement>,
        false,
      );

      socketEmitters.emitUpdate(
        selectionState.elementId,
        updates as Partial<import("../types/canvas.types").CanvasElement>,
      );

      return;
    }

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

      const newX = state.elementStart.x + deltaX;
      const newY = state.elementStart.y + deltaY;

      const updates: Record<string, unknown> = {
        x: newX,
        y: newY,
      };

      if (state.startPoints) {
        updates.points = state.startPoints.map((p) => ({
          x: p.x + deltaX,
          y: p.y + deltaY,
        }));
      }

      updateElement(
        state.elementId,
        updates as Partial<import("../types/canvas.types").CanvasElement>,
        false,
      );

      // Broadcast live drag position (and points) to collaborators
      socketEmitters.emitUpdate(
        state.elementId,
        updates as Partial<import("../types/canvas.types").CanvasElement>,
      );

      state.lastPosition = {
        x: newX,
        y: newY,
      };

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

    if (selectionInteraction.current.type === "resize") {
      const s = selectionInteraction.current;
      const element = getState().elements.find((el) => el.id === s.elementId);

      if (element) {
        useHistoryStore.getState().pushOperation({
          type: "update",
          elementId: s.elementId,
          before: {
            x: s.startBounds.x,
            y: s.startBounds.y,
            width: s.startBounds.width,
            height: s.startBounds.height,
            ...(s.startPoints ? { points: s.startPoints } : {}),
          },
          after: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            ...(("points" in element) ? { points: element.points } : {}),
          },
        });
        // Broadcast final resize to collaborators (including points if present)
        socketEmitters.emitUpdate(s.elementId, {
          x: element.x, y: element.y,
          width: element.width, height: element.height,
          ...("points" in element ? { points: element.points } : {}),
        });
      }

      releasePointerCapture(event);

      selectionInteraction.current = {
        type: "none",
      };

      return;
    }


    if (selectionInteraction.current.type === "rotate") {
      const s = selectionInteraction.current;
      const element = getState().elements.find((el) => el.id === s.elementId);

      if (element) {
        useHistoryStore.getState().pushOperation({
          type: "update",
          elementId: s.elementId,
          before: { rotation: s.startRotation },
          after: { rotation: element.rotation },
        });
        // Broadcast final rotation
        socketEmitters.emitUpdate(s.elementId, { rotation: element.rotation });
      }

      releasePointerCapture(event);

      selectionInteraction.current = {
        type: "none",
      };

      return;
    }

    
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
      // The element is already at lastPosition from live preview updates.
      // We only need to record the history operation with the correct
      // before (elementStart) and after (lastPosition).
      const movedX = state.lastPosition.x !== state.elementStart.x;
      const movedY = state.lastPosition.y !== state.elementStart.y;

      if (movedX || movedY) {
        const currentElement = getState().elements.find((el) => el.id === state.elementId);
        useHistoryStore.getState().pushOperation({
          type: "update",
          elementId: state.elementId,
          before: {
            x: state.elementStart.x,
            y: state.elementStart.y,
            ...(state.startPoints ? { points: state.startPoints } : {}),
          },
          after: {
            x: state.lastPosition.x,
            y: state.lastPosition.y,
            ...(currentElement && "points" in currentElement ? { points: currentElement.points } : {}),
          },
        });

        // Broadcast final drag position & points to collaborators
        if (currentElement) {
          socketEmitters.emitUpdate(state.elementId, {
            x: state.lastPosition.x,
            y: state.lastPosition.y,
            ...("points" in currentElement ? { points: currentElement.points } : {}),
          });
        }
      }

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
          getState().selectElement(element.id);
          getState().setActiveTool("select");
          // Broadcast new element to collaborators
          socketEmitters.emitAdd(element);
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

    if (event.ctrlKey) {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const mouseScreen: Point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const mouseWorldBefore = screenToWorld(mouseScreen, camera);
     
      const delta = event.deltaY;
      const zoomFactor = delta < 0 ? 1.08 : 1 / 1.08;
      const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.05), 20);
      const newCameraX = mouseWorldBefore.x - mouseScreen.x / newZoom;
      const newCameraY = mouseWorldBefore.y - mouseScreen.y / newZoom;
      setCamera({ x: newCameraX, y: newCameraY, zoom: newZoom });
    } else {

      setCamera({
        x: camera.x + event.deltaX / camera.zoom,
        y: camera.y + event.deltaY / camera.zoom,
        zoom: camera.zoom,
      });
    }
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


const resizeElement = (
  handle: ResizeHandle,
  startBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  startMouse: Point,
  mouse: Point,
) => {
  const minSize = 10;

  let { x, y, width, height } = startBounds;

  const deltaX = mouse.x - startMouse.x;

  const deltaY = mouse.y - startMouse.y;

  switch (handle) {
    case "right":
      width = Math.max(minSize, startBounds.width + deltaX);
      break;

    case "left": {
      const newX = Math.min(
        mouse.x,
        startBounds.x + startBounds.width - minSize,
      );

      x = newX;

      width = startBounds.width + (startBounds.x - newX);

      break;
    }

    case "bottom":
      height = Math.max(minSize, startBounds.height + deltaY);
      break;

    case "top": {
      const newY = Math.min(
        mouse.y,
        startBounds.y + startBounds.height - minSize,
      );

      y = newY;

      height = startBounds.height + (startBounds.y - newY);

      break;
    }

    case "bottom-right":
      width = Math.max(minSize, startBounds.width + deltaX);

      height = Math.max(minSize, startBounds.height + deltaY);

      break;

    case "bottom-left": {
      const newX = Math.min(
        mouse.x,
        startBounds.x + startBounds.width - minSize,
      );

      x = newX;

      width = startBounds.width + (startBounds.x - newX);

      height = Math.max(minSize, startBounds.height + deltaY);

      break;
    }

    case "top-right": {
      const newY = Math.min(
        mouse.y,
        startBounds.y + startBounds.height - minSize,
      );

      y = newY;

      height = startBounds.height + (startBounds.y - newY);

      width = Math.max(minSize, startBounds.width + deltaX);

      break;
    }

    case "top-left": {
      const newX = Math.min(
        mouse.x,
        startBounds.x + startBounds.width - minSize,
      );

      const newY = Math.min(
        mouse.y,
        startBounds.y + startBounds.height - minSize,
      );

      x = newX;
      y = newY;

      width = startBounds.width + (startBounds.x - newX);

      height = startBounds.height + (startBounds.y - newY);

      break;
    }
  }

  return {
    x,
    y,
    width,
    height,
  };
};