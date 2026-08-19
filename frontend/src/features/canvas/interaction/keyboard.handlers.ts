import { useEffect } from "react";

import { useCanvasStore } from "../state/canvas.store";

export const useCanvasKeyboardHandlers = () => {
  const selectedElementId = useCanvasStore((state) => state.selectedElementId);

  const removeElement = useCanvasStore((state) => state.removeElement);

  const selectElement = useCanvasStore((state) => state.selectElement);

  const undo = useCanvasStore((state) => state.undo);

  const redo = useCanvasStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape: deselect
      if (event.key === "Escape") {
        selectElement(null);
        return;
      }

      const isModifier = event.ctrlKey || event.metaKey;

      // Ctrl+Z / Cmd+Z → undo; Ctrl+Shift+Z / Cmd+Shift+Z → redo
      if (isModifier && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      // Ctrl+Y / Cmd+Y → redo
      if (isModifier && event.key.toLowerCase() === "y") {
        event.preventDefault();

        redo();

        return;
      }

      // Delete / Backspace → remove selected element (no modifier)
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (!selectedElementId) {
        return;
      }

      const target = event.target as HTMLElement;

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) {
        return;
      }

      removeElement(selectedElementId);

      selectElement(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElementId, removeElement, selectElement, undo, redo]);
};
