import { create } from "zustand";

import type { Camera, CanvasElement, Point, Tool } from "../types/canvas.types";

import { useHistoryStore } from "../history/history.store";

import {
  applyOperation,
  reverseOperation,
} from "../history/operation.executor";

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

  updateElement: (
    elementId: string,

    updates: Partial<CanvasElement>,

    recordHistory?: boolean,
  ) => void;

  removeElement: (elementId: string) => void;

  setDraftElement: (element: CanvasElement | null) => void;

  setCamera: (camera: Camera) => void;

  setActiveTool: (tool: Tool) => void;

  selectElement: (elementId: string | null) => void;

  setPendingTextEdit: (edit: PendingTextEdit | null) => void;

  undo: () => void;

  redo: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
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

  addElement: (element) => {
    set((state) => ({
      elements: [...state.elements, element],
    }));

    useHistoryStore.getState().pushOperation({
      type: "create",

      element,
    });
  },

  updateElement: (elementId, updates, recordHistory = true) => {
    const element = get().elements.find((item) => item.id === elementId);

    if (!element) {
      return;
    }

    const before: Partial<CanvasElement> = {};

    const after: Partial<CanvasElement> = {};

    for (const key of Object.keys(updates) as Array<keyof CanvasElement>) {
      before[key] = element[key] as never;

      after[key] = updates[key] as never;
    }

    set((state) => ({
      elements: state.elements.map((item) => {
        if (item.id !== elementId) {
          return item;
        }

        return {
          ...item,
          ...updates,

          updatedAt: Date.now(),
        } as CanvasElement;
      }),
    }));

    if (recordHistory) {
      useHistoryStore.getState().pushOperation({
        type: "update",

        elementId,

        before,

        after,
      });
    }
  },

  removeElement: (elementId) => {
    const element = get().elements.find((item) => item.id === elementId);

    if (!element) {
      return;
    }

    set((state) => ({
      elements: state.elements.filter((item) => item.id !== elementId),
    }));

    useHistoryStore.getState().pushOperation({
      type: "delete",

      element,
    });
  },

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

  undo: () => {
    const operation = useHistoryStore.getState().undo();

    if (!operation) {
      return;
    }

    const reverse = reverseOperation(operation);

    set((state) => ({
      elements: applyOperation(state.elements, reverse),
    }));
  },

  redo: () => {
    const operation = useHistoryStore.getState().redo();

    if (!operation) {
      return;
    }

    set((state) => ({
      elements: applyOperation(state.elements, operation),
    }));
  },
}));
