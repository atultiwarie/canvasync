import { create } from "zustand";

import type { CanvasOperation } from "./operation.types";

type HistoryState = {
  undoStack: CanvasOperation[];

  redoStack: CanvasOperation[];

  pushOperation: (operation: CanvasOperation) => void;

  undo: () => CanvasOperation | null;

  redo: () => CanvasOperation | null;

  clear: () => void;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],

  redoStack: [],

  pushOperation: (operation) => {
    set((state) => ({
      undoStack: [...state.undoStack, operation],
      // Any new action clears the redo stack
      redoStack: [],
    }));
  },

  undo: () => {
    const { undoStack } = get();

    if (undoStack.length === 0) {
      return null;
    }

    const operation = undoStack[undoStack.length - 1];

    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, operation],
    }));

    return operation;
  },

  redo: () => {
    const { redoStack } = get();

    if (redoStack.length === 0) {
      return null;
    }

    const operation = redoStack[redoStack.length - 1];

    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, operation],
    }));

    return operation;
  },

  clear: () => {
    set({
      undoStack: [],
      redoStack: [],
    });
  },
}));
