import { create } from "zustand";

import type { Camera, CanvasElement, Tool } from "../types/canvas.types";

interface CanvasState {
  elements: CanvasElement[];

  draftElement: CanvasElement | null;

  camera: Camera;

  selectedElementId: string | null;

  activeTool: Tool;

  setElements: (elements: CanvasElement[]) => void;

  addElement: (element: CanvasElement) => void;

  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;

  removeElement: (elementId: string) => void;

  setDraftElement: (element: CanvasElement | null) => void;

  setCamera: (camera: Camera) => void;

  setActiveTool: (tool: Tool) => void;

  selectElement: (elementId: string | null) => void;
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
      elements: state.elements.map((element) =>
        element.id === elementId
          ? ({
              ...element,
              ...updates,
              updatedAt: Date.now(),
            } as CanvasElement)
          : element,
      ),
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
}));
