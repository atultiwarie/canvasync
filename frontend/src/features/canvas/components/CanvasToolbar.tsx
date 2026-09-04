import type { Tool } from "../types/canvas.types";
import { useCanvasStore } from "../state/canvas.store";

const TOOL_ICONS: Record<string, React.ReactNode> = {
  select: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path
        d="M5 3l14 7-7 3-3 7L5 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  hand: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path
        d="M18 11V8a2 2 0 0 0-4 0v3M14 11V6a2 2 0 0 0-4 0v5M10 11V8a2 2 0 0 0-4 0v8l4 4h6a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  rectangle: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  ellipse: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <ellipse cx="12" cy="12" rx="9" ry="6" />
    </svg>
  ),
  line: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <line x1="5" y1="19" x2="19" y2="5" strokeLinecap="round" />
    </svg>
  ),
  arrow: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path
        d="M5 19L19 5M19 5H9M19 5v10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  freedraw: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M4 20c4-4 4-8 8-8s4 4 8 0" strokeLinecap="round" />
    </svg>
  ),
  text: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path
        d="M4 7V4h16v3M9 20h6M12 4v16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

interface ToolButtonProps {
  tool: Tool;
  label: string;
  activeTool: Tool;
  onSelect: (tool: Tool) => void;
  disabled?: boolean;
}

/** Desktop text button (xl+ screens) */
function ToolButton({
  tool,
  label,
  activeTool,
  onSelect,
  disabled,
}: ToolButtonProps) {
  const isActive = activeTool === tool;
  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      disabled={disabled}
      title={label}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

/** Mobile/Tablet icon button (< xl screens) */
function IconButton({
  tool,
  label,
  activeTool,
  onSelect,
  disabled,
}: ToolButtonProps) {
  const isActive = activeTool === tool;
  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {TOOL_ICONS[tool] ?? <span className="text-xs">{label[0]}</span>}
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

const ALL_TOOLS = [...NAV_TOOLS, ...DRAW_TOOLS];

interface CanvasToolbarProps {
  readOnly?: boolean;
}

const UndoIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-4 w-4"
  >
    <path
      d="M3 9h13a5 5 0 0 1 0 10H7M3 9l4-4M3 9l4 4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const RedoIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-4 w-4"
  >
    <path
      d="M21 9H8a5 5 0 0 0 0 10h9M21 9l-4-4M21 9l-4 4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function CanvasToolbar({
  readOnly = false,
}: CanvasToolbarProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  return (
    <>
      {/* ── Desktop: horizontal strip pinned to top-centre (xl+ screens only) ── */}
      <div
        className="fixed left-1/2 top-2.5 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-lg backdrop-blur-md xl:flex"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {NAV_TOOLS.map(({ tool, label }) => (
          <ToolButton
            key={tool}
            tool={tool}
            label={label}
            activeTool={activeTool}
            onSelect={setActiveTool}
          />
        ))}
        <div className="mx-0.5 my-auto h-4 w-px bg-slate-200" />
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
        <div className="mx-0.5 my-auto h-4 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => undo()}
          disabled={readOnly}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => redo()}
          disabled={readOnly}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Redo
        </button>
        {readOnly && (
          <>
            <div className="mx-0.5 my-auto h-4 w-px bg-slate-200" />
            <span className="flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              View only
            </span>
          </>
        )}
      </div>

      {/* ── Mobile & Tablet: floating bottom island (< xl screens) ── */}
      <div
        className="fixed bottom-3 left-1/2 z-20 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-0.5 sm:gap-1 rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-1.5 shadow-xl backdrop-blur-md xl:hidden"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {ALL_TOOLS.map(({ tool, label }) => (
          <IconButton
            key={tool}
            tool={tool}
            label={label}
            activeTool={activeTool}
            onSelect={setActiveTool}
            disabled={readOnly && tool !== "select" && tool !== "hand"}
          />
        ))}
        <div className="mx-0.5 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => undo()}
          disabled={readOnly}
          title="Undo"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          {UndoIcon}
        </button>
        <button
          type="button"
          onClick={() => redo()}
          disabled={readOnly}
          title="Redo"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          {RedoIcon}
        </button>
        {readOnly && (
          <span className="ml-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
            View only
          </span>
        )}
      </div>
    </>
  );
}
