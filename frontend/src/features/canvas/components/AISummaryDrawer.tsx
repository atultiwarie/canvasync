import { useEffect, useRef } from "react";
import type { AISummaryResult } from "../../boards/board.service";

type DrawerState = "loading" | "success" | "error";

interface AISummaryDrawerProps {
  state: DrawerState;
  result: AISummaryResult | null;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

/** Sparkle icon */
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3v1M12 20v1M3 12h1M20 12h1M5.636 5.636l.707.707M17.657 17.657l.707.707M5.636 18.364l.707-.707M17.657 6.343l.707-.707" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  );
}

/** Shimmer skeleton for loading state */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ""}`} />
  );
}

export default function AISummaryDrawer({
  state,
  result,
  error,
  onClose,
  onRetry,
}: AISummaryDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        ref={drawerRef}
        className="fixed inset-0 z-50 flex flex-col bg-white shadow-2xl sm:inset-auto sm:right-0 sm:top-0 sm:h-screen sm:w-full sm:max-w-sm sm:border-l sm:border-slate-200"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white">
              <SparklesIcon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-slate-900">AI Board Summary</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Loading skeleton */}
          {state === "loading" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-purple-600">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600"/>
                Analyzing board elements and flows…
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-3.5 w-4/6" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Analysis failed</p>
                <p className="mt-1 text-xs text-slate-500">{error ?? "An unexpected error occurred."}</p>
              </div>
              <button
                onClick={onRetry}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* Success state */}
          {state === "success" && result && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-500">
                  Identified As
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900">{result.title}</h3>
              </div>

              {/* Summary */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Overview
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{result.summary}</p>
              </div>

              {/* Components */}
              {result.components.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Identified Components
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.components.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {result.insights.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Insights & Observations
                  </p>
                  <ul className="mt-2 space-y-2">
                    {result.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                        <span className="text-sm text-slate-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        {state === "success" && result && (
          <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.rawMarkdown);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy Markdown
            </button>
            <button
              onClick={onRetry}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Re-analyze
            </button>
          </div>
        )}
      </div>
    </>
  );
}

