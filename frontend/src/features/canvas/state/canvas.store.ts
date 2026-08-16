import {create} from 'zustand';

import type{
    Camera,
    CanvasElement,
    Tool
}from "../types/canvas.types"

interface CanvasState {
    elements: CanvasElement[];
    camera: Camera;
    selectedElementId: string | null;
    activeTool: Tool;

    setElements:(
        elements: CanvasElement[]
    )=>void;

    setCamera:(
        camera: Camera
    )=>void;

    setActiveTool:(
        tool: Tool
    )=>void;

    selectElement:(
        elementId: string | null
    )=>void;

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

  setElements: (elements) => set({ elements }),
  setCamera: (camera) => set({ camera }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  selectElement: (selectedElementId) => set({ selectedElementId }),
}));
