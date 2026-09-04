import { useEffect, useRef, useState, useId, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCanvasStore } from "../../canvas/state/canvas.store";

import {
  boardService,
  type Board,
  type AISummaryResult,
} from "../board.service";

import CanvasBoard from "../../canvas/components/CanvasBoard";
import CanvasToolbar from "../../canvas/components/CanvasToolbar";
import RemoteCursors from "../../canvas/components/RemoteCursors";
import ShareModal from "../../canvas/components/ShareModal";
import AISummaryDrawer from "../../canvas/components/AISummaryDrawer";
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
  exportSVG,
  generateBoardPngBase64,
  // importJSON,  // reserved for future import feature
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
      className="fixed bottom-16 sm:bottom-4 left-3 sm:left-4 z-20 flex items-center gap-0.5 rounded-xl border border-slate-200/90 bg-white/95 px-1 py-1 shadow-md backdrop-blur-md"
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
        className="min-w-14 rounded-lg px-1.5 py-1 text-center text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100"
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
        <span className="hidden xl:inline">Export</span>
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

      {/* Dropdown panel — anchored below the button to the right */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
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

  // ── Phase 6: AI Summary ───────────────────────────────────────────────────
  type AiState = "idle" | "loading" | "success" | "error";
  const [aiState, setAiState] = useState<AiState>("idle");
  const [aiResult, setAiResult] = useState<AISummaryResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAISummarize = useCallback(async () => {
    if (!boardId || elements.length === 0) return;
    setAiState("loading");
    setAiResult(null);
    setAiError(null);
    try {
      const imageBase64 = generateBoardPngBase64(elements);
      if (!imageBase64) throw new Error("Could not render board image.");
      const result = await boardService.summarizeBoard(
        boardId,
        imageBase64,
        title,
      );
      setAiResult(result);
      setAiState("success");
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "AI summarization failed. Please try again.",
      );
      setAiState("error");
    }
  }, [boardId, elements, title]);
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
      {/* ── Top Header Bar (Split Left & Right Clusters) ── */}
      <header
        className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between px-2.5 sm:px-4 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Top-Left: Navigation & Board Title */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-md">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/boards")}
            title="Back to boards"
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition"
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

          <div className="h-4 w-px bg-slate-200" />

          {/* Board title */}
          <div className="flex items-center">
            {editingTitle && !readOnly ? (
              <input
                id={titleInputId}
                autoFocus
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleTitleKeyDown}
                className="w-28 sm:w-40 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
              />
            ) : (
              <button
                type="button"
                onClick={!readOnly ? startEditing : undefined}
                title={readOnly ? "View only" : "Click to rename"}
                className={`max-w-[100px] sm:max-w-44 truncate text-left text-xs sm:text-sm font-semibold text-slate-800 ${
                  readOnly ? "cursor-default" : "hover:text-slate-500"
                }`}
              >
                {title}
              </button>
            )}
          </div>
        </div>

        {/* Top-Right: Actions (Share, Export, AI, UserMenu) */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-sm backdrop-blur-md">
          {/* Share button — editors/owners only */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              title="Share board"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
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
              <span className="hidden xl:inline">Share</span>
            </button>
          )}

          {/* Export dropdown */}
          <ExportDropdown boardTitle={title} elements={elements} />

          {/* AI Summary button */}
          <button
            type="button"
            onClick={handleAISummarize}
            disabled={elements.length === 0 || aiState === "loading"}
            title="AI Board Summary"
            className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {aiState === "loading" ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
            ) : (
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  d="M12 3v1M12 20v1M3 12h1M20 12h1M5.636 5.636l.707.707M17.657 17.657l.707.707M5.636 18.364l.707-.707M17.657 6.343l.707-.707"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="4" />
              </svg>
            )}
            <span className="hidden xl:inline">
              {aiState === "loading" ? "Analyzing…" : "AI Summary"}
            </span>
          </button>

          <div className="mx-0.5 h-5 w-px bg-slate-200" />

          {/* User Menu avatar rendered inline right here */}
          <UserMenu className="relative" />
        </div>
      </header>

      <CanvasBoard readOnly={readOnly} />
      <RemoteCursors cursors={remoteCursors} />
      <CanvasToolbar readOnly={readOnly} />
      <ZoomControls />

      {currentBoard && !readOnly && (
        <ShareModal
          board={currentBoard}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* AI Summary Drawer — slides in from the right */}
      {(aiState === "loading" ||
        aiState === "success" ||
        aiState === "error") && (
        <AISummaryDrawer
          state={aiState}
          result={aiResult}
          error={aiError}
          onClose={() => setAiState("idle")}
          onRetry={handleAISummarize}
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
