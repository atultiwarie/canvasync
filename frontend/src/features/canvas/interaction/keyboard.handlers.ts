import { useEffect } from "react";

import { useCanvasStore } from "../state/canvas.store";

export const useCanvasKeyboardHandlers = () => {
  const selectedElementId = useCanvasStore((state) => state.selectedElementId);

  const removeElement = useCanvasStore((state) => state.removeElement);

  const selectElement = useCanvasStore((state) => state.selectElement);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
   
      if (event.key === "Escape") {
        selectElement(null);

        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (!selectedElementId) {
        return;
      }

      removeElement(selectedElementId);

      selectElement(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElementId, removeElement, selectElement]);
};
