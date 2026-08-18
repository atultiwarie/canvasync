import { useEffect, useRef } from "react";

import {
  clearCanvas,
  renderElements,
  renderSelection,
} from "../engine/renderer";

import { useCanvasPointerHandlers } from "../interaction/pointer.handler";

import { useCanvasKeyboardHandlers } from "../interaction/keyboard.handlers";

import { useCanvasStore } from "../state/canvas.store";

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const elements = useCanvasStore((state) => state.elements);

  const camera = useCanvasStore((state) => state.camera);

  const draftElement = useCanvasStore((state) => state.draftElement);

  const selectedElementId = useCanvasStore((state) => state.selectedElementId);

  const activeTool = useCanvasStore((state) => state.activeTool);

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

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;

      canvas.width = window.innerWidth * dpr;

      canvas.height = window.innerHeight * dpr;

      canvas.style.width = `${window.innerWidth}px`;

      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      clearCanvas(ctx, canvas);

      renderElements(ctx, elements, camera, draftElement);

      if (selectedElementId) {
        const selectedElement = elements.find(
          (element) => element.id === selectedElementId,
        );

        if (selectedElement) {
          renderSelection(ctx, selectedElement, camera);
        }
      }
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [elements, camera, draftElement, selectedElementId]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 bg-white ${
        activeTool === "hand" ? "cursor-grab" : "cursor-crosshair"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onWheel={handleWheel}
    />
  );
}
