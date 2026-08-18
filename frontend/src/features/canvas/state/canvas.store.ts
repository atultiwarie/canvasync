import { create } from "zustand";

import type { Camera, CanvasElement, LineElement, Point, Tool } from "../types/canvas.types";

export type PendingTextEdit = {
  worldPoint: Point;
  elementId?: string;
  initialText: string;
};

interface CanvasState {
  elements: CanvasElement[];

  draftElement: CanvasElement | null;

  camera: Camera;

  selectedElementId: string | null;

  activeTool: Tool;

  pendingTextEdit: PendingTextEdit | null;

  setElements: (elements: CanvasElement[]) => void;

  addElement: (element: CanvasElement) => void;

  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;

  removeElement: (elementId: string) => void;

  setDraftElement: (element: CanvasElement | null) => void;

  setCamera: (camera: Camera) => void;

  setActiveTool: (tool: Tool) => void;

  selectElement: (elementId: string | null) => void;

  setPendingTextEdit: (edit: PendingTextEdit | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  elements: [],

  camera: {
    x: 0,
    y: 0,
    zoom: 1,
  },

  selectedElementId: null,

  activeTool: "select",

  draftElement: null,

  pendingTextEdit: null,

  setElements: (elements) =>
    set({
      elements,
    }),

  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
    })),

  updateElement: (elementId, updates) =>
    set((state) => ({
      elements: state.elements.map((element) => {
        if (element.id !== elementId) {
          return element;
        }

        const updated = {
          ...element,
          ...updates,
          updatedAt: Date.now(),
        } as CanvasElement;

        const updatesRecord = updates as Record<string, unknown>;

        // Auto-recalculate width & height for text elements when text is updated
        if (updated.type === "text" && typeof updatesRecord.text === "string") {
          const fontSize = updated.fontSize || 24;
          const lines = updatesRecord.text.split("\n");
          const maxLineLen = Math.max(...lines.map((l: string) => l.length), 1);
          updated.width = Math.max(maxLineLen * fontSize * 0.6, 20);
          updated.height = fontSize * 1.3 * Math.max(lines.length, 1);
        }

        // Shift points when x/y is moved on point-based elements
        if (
          typeof updates.x === "number" &&
          typeof updates.y === "number" &&
          "points" in element &&
          element.points &&
          !updatesRecord.points
        ) {
          const dx = updates.x - element.x;
          const dy = updates.y - element.y;
          if (dx !== 0 || dy !== 0) {
            (updated as LineElement).points = element.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
          }
        }

        return updated;
      }),
    })),

  removeElement: (elementId) =>
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== elementId),
    })),

  setCamera: (camera) =>
    set({
      camera,
    }),

  setActiveTool: (activeTool) =>
    set({
      activeTool,
    }),

  selectElement: (selectedElementId) =>
    set({
      selectedElementId,
    }),

  setDraftElement: (draftElement) =>
    set({
      draftElement,
    }),

  setPendingTextEdit: (pendingTextEdit) =>
    set({
      pendingTextEdit,
    }),
}));
