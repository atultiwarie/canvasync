import { useEffect, useRef } from "react";

import { screenToWorld } from "../engine/coordinates";

import { createRectangleElement } from "../engine/element.factory";

import { useCanvasStore } from "../state/canvas.store";

import { clearCanvas, renderElements } from "../engine/renderer";

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const elements = useCanvasStore((state) => state.elements);

  const camera = useCanvasStore((state) => state.camera);

  const addElement = useCanvasStore((state) => state.addElement);

  const activeTool = useCanvasStore((state) => state.activeTool);

  const draftElement = useCanvasStore((state) => state.draftElement);

  const setDraftElement = useCanvasStore((state) => state.setDraftElement);

const drawingStart = useRef<{
  x: number;
  y: number;
} | null>(null);

const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
  if (activeTool !== "rectangle") {
    return;
  }

  const canvas = canvasRef.current;

  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();

  const screenPoint = {
    x: event.clientX - rect.left,

    y: event.clientY - rect.top,
  };

  const worldPoint = screenToWorld(screenPoint, camera);

  drawingStart.current = worldPoint;

  canvas.setPointerCapture(event.pointerId);
};

const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
  if (activeTool !== "rectangle" || !drawingStart.current) {
    return;
  }

  const canvas = canvasRef.current;

  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();

  const screenPoint = {
    x: event.clientX - rect.left,

    y: event.clientY - rect.top,
  };

  const end = screenToWorld(screenPoint, camera);

  const element = createRectangleElement(drawingStart.current, end);

  if (element.width >= 2 && element.height >= 2) {
    addElement(element);
  }

  drawingStart.current = null;

  setDraftElement(null);

  canvas.releasePointerCapture(event.pointerId);
};

const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
  if (activeTool !== "rectangle" || !drawingStart.current) {
    return;
  }

  const canvas = canvasRef.current;

  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();

  const screenPoint = {
    x: event.clientX - rect.left,

    y: event.clientY - rect.top,
  };

  const worldPoint = screenToWorld(screenPoint, camera);

  const draft = createRectangleElement(drawingStart.current, worldPoint);

  setDraftElement(draft);
};

const handlePointerCancel = () => {
  drawingStart.current = null;

  setDraftElement(null);
};

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
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [elements, camera,draftElement]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 bg-white"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
}
