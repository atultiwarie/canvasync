import type { Tool } from "../types/canvas.types";
import { useCanvasStore } from "../state/canvas.store";

interface ToolButtonProps {
  tool: Tool;
  label: string;
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
}

function ToolButton({ tool, label, activeTool, onSelect }: ToolButtonProps) {
  const isActive = activeTool === tool;

  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      className={`rounded px-3 py-2 text-sm transition-colors ${
        isActive ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

const TOOLS: { tool: Tool; label: string }[] = [
  { tool: "select", label: "Select" },
  { tool: "rectangle", label: "Rectangle" },
  { tool: "ellipse", label: "Ellipse" },
  { tool: "line", label: "Line" },
  { tool: "arrow", label: "Arrow" },
  { tool: "freedraw", label: "Draw" },
  { tool: "text", label: "Text" },
  { tool: "hand", label: "Hand" },
];

export default function CanvasToolbar() {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);

  return (
    <div
      className="fixed left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2 rounded-lg border bg-white p-2 shadow-lg"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      {TOOLS.map(({ tool, label }) => (
        <ToolButton
          key={tool}
          tool={tool}
          label={label}
          activeTool={activeTool}
          onSelect={setActiveTool}
        />
      ))}
      <div className="mx-1 my-auto h-5 w-[1px] bg-slate-200" />
      <button
        type="button"
        onClick={() => undo()}
        className="rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => redo()}
        className="rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
      >
        Redo
      </button>
    </div>
  );
}
