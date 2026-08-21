import { useEffect, useRef } from "react";

import type { CanvasElement } from "../types/canvas.types";

import {
  clearCanvas,
  renderElements,
  renderSelection,
} from "../engine/renderer";

import TextEditor from "./TextEditor";
// import PropertiesPanel from "./PropertiesPanel";

import { createTextElement } from "../engine/element.factory";

import { useCanvasPointerHandlers } from "../interaction/pointer.handler";

import { useCanvasKeyboardHandlers } from "../interaction/keyboard.handlers";

import { useCanvasStore } from "../state/canvas.store";

import { worldToScreen, screenToWorld } from "../engine/coordinates";

import { findElementAtPoint } from "../engine/hitTest";

import { socketEmitters } from "../../boards/pages/CanvasPage";

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const elements = useCanvasStore((state) => state.elements);
  const camera = useCanvasStore((state) => state.camera);
  const draftElement = useCanvasStore((state) => state.draftElement);
  const selectedElementId = useCanvasStore((state) => state.selectedElementId);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const pendingTextEdit = useCanvasStore((state) => state.pendingTextEdit);
  const setPendingTextEdit = useCanvasStore((state) => state.setPendingTextEdit);

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleWheel,
  } = useCanvasPointerHandlers();

  useCanvasKeyboardHandlers();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxRef.current = ctx;
    };

    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    return () => window.removeEventListener("resize", sizeCanvas);
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const elementsToRender = pendingTextEdit?.elementId
      ? elements.filter((el) => el.id !== pendingTextEdit.elementId)
      : elements;

    clearCanvas(ctx, canvas);
    renderElements(ctx, elementsToRender, camera, draftElement);

    if (selectedElementId) {
      const selectedElement = elements.find((el) => el.id === selectedElementId);
      if (selectedElement) {
        renderSelection(ctx, selectedElement, camera);
      }
    }
  }, [elements, camera, draftElement, selectedElementId, pendingTextEdit]);

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const worldPoint = screenToWorld(screenPoint, camera);
    const element = findElementAtPoint(worldPoint, elements);

    if (element) {
      selectElement(element.id);

      if (element.type === "text") {
        setPendingTextEdit({
          worldPoint: { x: element.x, y: element.y },
          elementId: element.id,
          initialText: element.text,
        });
      } else {
        setPendingTextEdit({
          worldPoint,
          initialText: "",
        });
      }
    } else {
      setPendingTextEdit({
        worldPoint,
        initialText: "",
      });
    }
  };

  const textEditorScreen = pendingTextEdit
    ? worldToScreen(pendingTextEdit.worldPoint, camera)
    : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 z-0 bg-white ${
          activeTool === "hand"
            ? "cursor-grab"
            : activeTool === "text"
              ? "cursor-text"
              : "cursor-crosshair"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />

      {/* <PropertiesPanel /> */}

      {textEditorScreen && pendingTextEdit && (
        <TextEditor
          screenX={textEditorScreen.x}
          screenY={textEditorScreen.y}
          initialValue={pendingTextEdit.initialText}
          zoom={camera.zoom}
          onSubmit={(text) => {
            if (pendingTextEdit.elementId) {
              updateElement(pendingTextEdit.elementId, { text } as Parameters<typeof updateElement>[1]);
              socketEmitters.emitUpdate(pendingTextEdit.elementId, { text } as Partial<CanvasElement>);
            } else {
              const newEl = createTextElement(pendingTextEdit.worldPoint, text);
              addElement(newEl);
              selectElement(newEl.id);
              socketEmitters.emitAdd(newEl);
            }
            setPendingTextEdit(null);
          }}
          onCancel={() => setPendingTextEdit(null)}
        />
      )}
    </>
  );
}
