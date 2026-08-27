import type { Tool } from "../types/canvas.types";
import { useCanvasStore } from "../state/canvas.store";

interface ToolButtonProps {
  tool: Tool;
  label: string;
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
  disabled?: boolean;
}

function ToolButton({ tool, label, activeTool, onSelect, disabled }: ToolButtonProps) {
  const isActive = activeTool === tool;

  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      disabled={disabled}
      className={`rounded px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

const DRAW_TOOLS: { tool: Tool; label: string }[] = [
  { tool: "rectangle", label: "Rectangle" },
  { tool: "ellipse", label: "Ellipse" },
  { tool: "line", label: "Line" },
  { tool: "arrow", label: "Arrow" },
  { tool: "freedraw", label: "Draw" },
  { tool: "text", label: "Text" },
];

const NAV_TOOLS: { tool: Tool; label: string }[] = [
  { tool: "select", label: "Select" },
  { tool: "hand", label: "Hand" },
];

interface CanvasToolbarProps {
  readOnly?: boolean;
}

export default function CanvasToolbar({ readOnly = false }: CanvasToolbarProps) {
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
      {/* Navigation tools — always available */}
      {NAV_TOOLS.map(({ tool, label }) => (
        <ToolButton
          key={tool}
          tool={tool}
          label={label}
          activeTool={activeTool}
          onSelect={setActiveTool}
        />
      ))}

      <div className="mx-1 my-auto h-5 w-px bg-slate-200" />

      {/* Drawing tools — disabled for viewers */}
      {DRAW_TOOLS.map(({ tool, label }) => (
        <ToolButton
          key={tool}
          tool={tool}
          label={label}
          activeTool={activeTool}
          onSelect={setActiveTool}
          disabled={readOnly}
        />
      ))}

      <div className="mx-1 my-auto h-5 w-px bg-slate-200" />

      {/* Undo / Redo — disabled for viewers */}
      <button
        type="button"
        onClick={() => undo()}
        disabled={readOnly}
        className="rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => redo()}
        disabled={readOnly}
        className="rounded bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Redo
      </button>

      {/* Viewer badge */}
      {readOnly && (
        <>
          <div className="mx-1 my-auto h-5 w-px bg-slate-200" />
          <span className="flex items-center rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            View only
          </span>
        </>
      )}
    </div>
  );
}
