import { useRef, useState } from "react";
import { useCanvasStore } from "../state/canvas.store";
import { exportJSON, exportPNG, exportSVG, importJSON } from "../engine/export.utils";
import type { CanvasElement } from "../types/canvas.types";

interface ExportModalProps {
  boardTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ boardTitle = "board", isOpen, onClose }: ExportModalProps) {
  const elements = useCanvasStore((s) => s.elements);
  const loadElements = useCanvasStore((s) => s.loadElements);

  const [busy, setBusy] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const run = (fn: () => void) => {
    setBusy(true);
    try { fn(); } finally { setBusy(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setImportMsg("Importing…");
    try {
      const { elements: imported } = await importJSON(file);
      loadElements(imported as CanvasElement[]);
      setImportMsg(`✓ Imported ${imported.length} element${imported.length !== 1 ? "s" : ""}`);
      setTimeout(() => { setImportMsg(null); setShowImport(false); onClose(); }, 1500);
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const btnClass =
    "w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-72 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Export</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Export buttons */}
        <div className="space-y-2">
          <button disabled={busy || elements.length === 0} className={btnClass}
            onClick={() => run(() => exportJSON(elements, boardTitle))}>
            Export as JSON
          </button>
          <button disabled={busy || elements.length === 0} className={btnClass}
            onClick={() => run(() => exportPNG(elements, boardTitle))}>
            Export as PNG
          </button>
          <button disabled={busy || elements.length === 0} className={btnClass}
            onClick={() => run(() => exportSVG(elements, boardTitle))}>
            Export as SVG
          </button>
        </div>

        {elements.length === 0 && (
          <p className="mt-3 text-center text-xs text-slate-400">Add elements to export.</p>
        )}

        {/* Import toggle */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <button
            onClick={() => { setShowImport((v) => !v); setImportMsg(null); }}
            className="flex w-full items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span>Import</span>
            <svg
              className={`h-3.5 w-3.5 transition-transform ${showImport ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Inline dropdown — expands below the toggle */}
          {showImport && (
            <div className="mt-2 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.canvassync.json"
                className="hidden"
                onChange={handleImport}
              />
              <button
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs text-slate-600 transition hover:border-slate-500 hover:text-slate-900 disabled:opacity-40"
              >
                Load .canvassync.json
              </button>
              {importMsg && (
                <p className={`text-center text-xs ${importMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>
                  {importMsg}
                </p>
              )}
              <p className="text-center text-[10px] text-slate-400">Replaces the current board.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
