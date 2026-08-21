import { useEffect, useRef, useState, useId, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCanvasStore } from "../../canvas/state/canvas.store";
import { boardService } from "../board.service";
import CanvasBoard from "../../canvas/components/CanvasBoard";
import CanvasToolbar from "../../canvas/components/CanvasToolbar";
import RemoteCursors from "../../canvas/components/RemoteCursors";
import UserMenu from "../../auth/components/UserMenu";
import { useSocket, type RemoteCursor } from "../../canvas/hooks/useSocket";
import type { CanvasElement } from "../../canvas/types/canvas.types";

const AUTOSAVE_DELAY_MS = 1500;

function ZoomControls() {
  const camera = useCanvasStore((s) => s.camera);
  const setCamera = useCanvasStore((s) => s.setCamera);

  const step = 1.25;
  const zoomIn  = () => setCamera({ ...camera, zoom: Math.min(camera.zoom * step, 20) });
  const zoomOut = () => setCamera({ ...camera, zoom: Math.max(camera.zoom / step, 0.05) });
  const resetZoom = () => setCamera({ x: 0, y: 0, zoom: 1 });
  const pct = Math.round(camera.zoom * 100);

  return (
    <div
      className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-1 py-1 shadow-md"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button" onClick={zoomOut}
        title="Zoom out (Ctrl + scroll)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
        disabled={camera.zoom <= 0.05}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <button
        type="button" onClick={resetZoom}
        title="Reset zoom to 100%"
        className="min-w-16 rounded-lg px-2 py-1 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        {pct}%
      </button>

      <button
        type="button" onClick={zoomIn}
        title="Zoom in (Ctrl + scroll)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
        disabled={camera.zoom >= 20}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

export default function CanvasPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const titleInputId = useId();

  const loadElements = useCanvasStore((s) => s.loadElements);
  const elements = useCanvasStore((s) => s.elements);

  const [title, setTitle] = useState("Untitled");
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const onCursorUpdate = useCallback((cursors: Map<string, RemoteCursor>) => {
    setRemoteCursors(cursors);
  }, []);

  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted   = useRef(true);
  const isInitialLoad = useRef(true);

    const { emitAdd, emitUpdate, emitDelete, emitCursor } = useSocket(
    boardId ?? "",
    onCursorUpdate
  );

  useEffect(() => {
    socketEmitters.emitAdd    = emitAdd;
    socketEmitters.emitUpdate = emitUpdate;
    socketEmitters.emitDelete = emitDelete;
    socketEmitters.emitCursor = emitCursor;
  }, [emitAdd, emitUpdate, emitDelete, emitCursor]);

  useEffect(() => {
    isMounted.current = true;
    isInitialLoad.current = true;
    if (!boardId) return;

    boardService
      .get(boardId)
      .then((board) => {
        if (!isMounted.current) return;
        setTitle(board.title);
        loadElements((board.elements ?? []) as CanvasElement[]);
        setTimeout(() => { isInitialLoad.current = false; }, 0);
      })
      .catch(() => navigate("/boards", { replace: true }));

    return () => {
      isMounted.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [boardId]);

  useEffect(() => {
    if (isInitialLoad.current || !boardId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        await boardService.saveElements(boardId, elements);
      } catch {
        /* silent fail — socket sync keeps collaborators live */
      }
    }, AUTOSAVE_DELAY_MS);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [elements, boardId]);

  const startEditing = () => { setDraftTitle(title); setEditingTitle(true); };

  const commitRename = async () => {
    setEditingTitle(false);
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === title || !boardId) return;
    try {
      const updated = await boardService.updateMeta(boardId, { title: trimmed });
      setTitle(updated.title);
    } catch { /* silent */ }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter")  { e.preventDefault(); commitRename(); }
    if (e.key === "Escape") { setEditingTitle(false); }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">

      {/* ── Left strip: back + title ── */}
      <div
        className="fixed left-4 top-4 z-20 flex items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          id="back-to-boards-btn"
          type="button"
          onClick={() => navigate("/boards")}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex flex-col gap-0.5">
          {editingTitle ? (
            <input
              id={titleInputId}
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleTitleKeyDown}
              className="w-40 rounded border border-slate-300 bg-white px-2 py-0.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              title="Click to rename"
              className="max-w-56 truncate text-left text-sm font-semibold text-slate-800 transition hover:text-slate-500"
            >
              {title}
            </button>
          )}
        </div>
      </div>

      <CanvasBoard />
      <RemoteCursors cursors={remoteCursors} />
      <CanvasToolbar />
      <ZoomControls />
      <UserMenu />
    </div>
  );
}

export const socketEmitters = {
  emitAdd:    (_el: CanvasElement) => {},
  emitUpdate: (_id: string, _updates: Partial<CanvasElement>) => {},
  emitDelete: (_id: string) => {},
  emitCursor: (_x: number, _y: number) => {},
};
