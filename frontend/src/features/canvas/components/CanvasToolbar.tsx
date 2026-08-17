import { useCanvasStore } from "../state/canvas.store";

export default function CanvasToolbar() {
  const activeTool = useCanvasStore((state) => state.activeTool);

  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  return (
    <div className="fixed left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2 rounded-lg border bg-white p-2 shadow-lg">
      <button
        type="button"
        onClick={() => setActiveTool("select")}
        className={`rounded px-3 py-2 text-sm ${
          activeTool === "select" ? "bg-slate-900 text-white" : "bg-slate-100"
        }`}
      >
        Select
      </button>

      <button
        type="button"
        onClick={() => setActiveTool("rectangle")}
        className={`rounded px-3 py-2 text-sm ${
          activeTool === "rectangle"
            ? "bg-slate-900 text-white"
            : "bg-slate-100"
        }`}
      >
        Rectangle
      </button>
    </div>
  );
}
