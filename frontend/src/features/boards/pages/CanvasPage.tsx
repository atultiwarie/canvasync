import { useEffect, useRef, useState, useId, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCanvasStore } from "../../canvas/state/canvas.store";
import { boardService, type Board } from "../board.service";
import CanvasBoard from "../../canvas/components/CanvasBoard";
import CanvasToolbar from "../../canvas/components/CanvasToolbar";
import RemoteCursors from "../../canvas/components/RemoteCursors";
import ShareModal from "../../canvas/components/ShareModal";
import UserMenu from "../../auth/components/UserMenu";
import {
  useSocket,
  type RemoteCursor,
  type BoardRole,
} from "../../canvas/hooks/useSocket";
import type { CanvasElement } from "../../canvas/types/canvas.types";
import {
  exportJSON,
  exportPNG,
  exportSVG /*, importJSON*/,
} from "../../canvas/engine/export.utils";

const AUTOSAVE_DELAY_MS = 1500;

function ZoomControls() {
  const camera = useCanvasStore((s) => s.camera);
  const setCamera = useCanvasStore((s) => s.setCamera);
  const step = 1.25;
  const zoomIn = () =>
    setCamera({ ...camera, zoom: Math.min(camera.zoom * step, 20) });
  const zoomOut = () =>
    setCamera({ ...camera, zoom: Math.max(camera.zoom / step, 0.05) });
  const resetZoom = () => setCamera({ x: 0, y: 0, zoom: 1 });
  const pct = Math.round(camera.zoom * 100);

  return (
    <div
      className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-1 py-1 shadow-md"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={zoomOut}
        disabled={camera.zoom <= 0.05}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        onClick={resetZoom}
        className="min-w-16 rounded-lg px-2 py-1 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        {pct}%
      </button>
      <button
        type="button"
        onClick={zoomIn}
        disabled={camera.zoom >= 20}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}

// Export Dropdown
interface ExportDropdownProps {
  boardTitle: string;
  elements: CanvasElement[];
  // loadElements: (els: CanvasElement[]) => void; // reserved for import
}

function ExportDropdown({
  boardTitle,
  elements /*, loadElements*/,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  // const [showImport, setShowImport] = useState(false);  // reserved for import
  // const [importMsg, setImportMsg] = useState<string | null>(null); // reserved for import
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null);  // reserved for import

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        // setShowImport(false);
        // setImportMsg(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   setImportMsg("Importing…");
  //   try {
  //     const { elements: imported } = await importJSON(file);
  //     loadElements(imported as CanvasElement[]);
  //     setImportMsg(`✓ ${imported.length} elements imported`);
  //     setTimeout(() => { setOpen(false); setShowImport(false); setImportMsg(null); }, 1500);
  //   } catch (err) {
  //     setImportMsg(err instanceof Error ? err.message : "Import failed");
  //   }
  //   if (fileInputRef.current) fileInputRef.current.value = "";
  // };

  const itemClass =
    "w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition";

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <svg
          className="h-3.5 w-3.5 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Export
        <svg
          className={`h-3 w-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel — anchored below the button */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {/* Export options */}
          <button
            disabled={elements.length === 0}
            className={itemClass}
            onClick={() => {
              exportJSON(elements, boardTitle);
              setOpen(false);
            }}
          >
            Export as JSON
          </button>
          <button
            disabled={elements.length === 0}
            className={itemClass}
            onClick={() => {
              exportPNG(elements, boardTitle);
              setOpen(false);
            }}
          >
            Export as PNG
          </button>
          <button
            disabled={elements.length === 0}
            className={itemClass}
            onClick={() => {
              exportSVG(elements, boardTitle);
              setOpen(false);
            }}
          >
            Export as SVG
          </button>

          {/* Divider + Import toggle */}
          <div className="my-1 border-t border-slate-100" />
          {/* <button
            className={`${itemClass} flex items-center justify-between`}
            onClick={() => { setShowImport((v) => !v); setImportMsg(null); }}
          >
            <span>Import JSON</span>
            <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showImport ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            </button> */}

          {/* {showImport && (
            <div className="mt-1 px-1 pb-1">
              <input ref={fileInputRef} type="file" accept=".json,.canvassync.json" className="hidden" onChange={handleImport}/>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-700"
              >
                Choose file…
              </button>
              {importMsg && (
                <p className={`mt-1.5 text-center text-[11px] ${importMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
                  {importMsg}
                </p>
              )}
            </div>
            )} */}
        </div>
      )}
    </div>
  );
}

// Canvas Page
export default function CanvasPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const titleInputId = useId();

  const loadElements = useCanvasStore((s) => s.loadElements);
  const elements = useCanvasStore((s) => s.elements);

  const [title, setTitle] = useState("Untitled");
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const [role, setRole] = useState<BoardRole>("owner");
  const readOnly = role === "viewer";

  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(
    new Map(),
  );
  const onCursorUpdate = useCallback(
    (cursors: Map<string, RemoteCursor>) => setRemoteCursors(cursors),
    [],
  );
  const onRoleReceived = useCallback((r: BoardRole) => setRole(r), []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const isInitialLoad = useRef(true);

  const { emitAdd, emitUpdate, emitDelete, emitCursor } = useSocket(
    boardId ?? "",
    onCursorUpdate,
    onRoleReceived,
  );

  useEffect(() => {
    socketEmitters.emitAdd = emitAdd;
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
        setCurrentBoard(board);
        setTitle(board.title);
        loadElements((board.elements ?? []) as CanvasElement[]);
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 0);
      })
      .catch(() => navigate("/boards", { replace: true }));
    return () => {
      isMounted.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [boardId]);

  useEffect(() => {
    if (isInitialLoad.current || !boardId || readOnly) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await boardService.saveElements(boardId, elements);
      } catch {
        /* silent */
      }
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [elements, boardId, readOnly]);

  const startEditing = () => {
    setDraftTitle(title);
    setEditingTitle(true);
  };
  const commitRename = async () => {
    setEditingTitle(false);
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === title || !boardId) return;
    try {
      const updated = await boardService.updateMeta(boardId, {
        title: trimmed,
      });
      setTitle(updated.title);
      setCurrentBoard((prev) =>
        prev ? { ...prev, title: updated.title } : prev,
      );
    } catch {
      /* silent */
    }
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    }
    if (e.key === "Escape") {
      setEditingTitle(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* ── Header bar ── */}
      <div
        className="fixed left-4 top-4 z-20 flex items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate("/boards")}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="h-5 w-px bg-slate-200" />

        {/* Board title */}
        <div className="flex flex-col gap-0.5">
          {editingTitle && !readOnly ? (
            <input
              id={titleInputId}
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleTitleKeyDown}
              className="w-40 rounded border border-slate-300 bg-white px-2 py-0.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
            />
          ) : (
            <button
              type="button"
              onClick={!readOnly ? startEditing : undefined}
              title={readOnly ? "View only" : "Click to rename"}
              className={`max-w-56 truncate text-left text-sm font-semibold text-slate-800 ${readOnly ? "cursor-default" : "hover:text-slate-500"}`}
            >
              {title}
            </button>
          )}
        </div>

        {/* Share button — editors/owners only */}
        {!readOnly && (
          <>
            <div className="h-5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg
                className="h-3.5 w-3.5 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Share
            </button>
          </>
        )}

        {/* Export dropdown — always visible */}
        <div className="h-5 w-px bg-slate-200" />
        <ExportDropdown boardTitle={title} elements={elements} />
      </div>

      <CanvasBoard readOnly={readOnly} />
      <RemoteCursors cursors={remoteCursors} />
      <CanvasToolbar readOnly={readOnly} />
      <ZoomControls />
      <UserMenu />

      {currentBoard && !readOnly && (
        <ShareModal
          board={currentBoard}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

export const socketEmitters = {
  emitAdd: (_el: CanvasElement) => {},
  emitUpdate: (_id: string, _updates: Partial<CanvasElement>) => {},
  emitDelete: (_id: string) => {},
  emitCursor: (_x: number, _y: number) => {},
};
