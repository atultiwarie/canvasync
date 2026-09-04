import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardService, type Board } from "../board.service";
import UserMenu from "../../auth/components/UserMenu";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BoardCard({
  board,
  onOpen,
  onDelete,
  onRename,
}: {
  board: Board;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const inputId = useId();
  const [confirming, setConfirming] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(board.title);

  const commitRename = async () => {
    setEditingTitle(false);
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === board.title) {
      setDraftTitle(board.title);
      return;
    }
    try {
      const updated = await boardService.updateMeta(board._id, {
        title: trimmed,
      });
      onRename(board._id, updated.title);
    } catch {
      setDraftTitle(board.title);
    }
  };

  return (
    <div className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Preview area */}
      <button
        type="button"
        onClick={() => onOpen(board._id)}
        className="flex h-28 w-full items-center justify-center rounded-md bg-slate-50 text-slate-300 transition group-hover:bg-slate-100"
        aria-label={`Open board ${board.title}`}
      >
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      </button>

      {/* Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              id={inputId}
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") {
                  setEditingTitle(false);
                  setDraftTitle(board.title);
                }
              }}
              className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpen(board._id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTitle(true);
                }}
                title="Click to open · Double-click to rename"
                className="block min-w-0 truncate text-left text-sm font-semibold text-slate-900 hover:underline"
              >
                {board.title}
              </button>
              {/* Pencil — visible on group hover */}
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                aria-label="Rename board"
                className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
          <p className="mt-0.5 text-xs text-slate-400">
            Updated {formatDate(board.updatedAt)}
          </p>
        </div>

        {/* Delete */}
        {confirming ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onDelete(board._id)}
              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            aria-label="Delete board"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function CreateBoardModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (board: Board) => void;
}) {
  const id = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setLoading(true);
    try {
      const board = await boardService.create({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onCreate(board);
    } catch {
      setError("Failed to create board. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          New board
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${id}-title`}
              className="text-sm font-medium text-slate-700"
            >
              Title
            </label>
            <input
              id={`${id}-title`}
              ref={inputRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="My awesome board"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${id}-desc`}
              className="text-sm font-medium text-slate-700"
            >
              Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id={`${id}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this board for?"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          {error && (
            <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              id="create-board-submit-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BoardsPage() {
  const navigate = useNavigate();

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    boardService
      .list()
      .then(setBoards)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = (board: Board) => {
    setBoards((prev) => [board, ...prev]);
    setShowCreate(false);
    navigate(`/boards/${board._id}`);
  };

  const handleDelete = async (boardId: string) => {
    try {
      await boardService.delete(boardId);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch {
      /* silently fail — card stays */
    }
  };

  const handleRename = (boardId: string, newTitle: string) => {
    setBoards((prev) =>
      prev.map((b) => (b._id === boardId ? { ...b, title: newTitle } : b)),
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 pr-14 sm:pr-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <svg
                className="h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              CanvasSync
            </span>
          </div>

          {/* New board button — profile handled by UserMenu (top-right corner) */}
          <button
            id="new-board-btn"
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New board
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
            My boards
          </h1>
          <span className="text-xs sm:text-sm text-slate-400">
            {boards.length} board{boards.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          </div>
        ) : boards.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 py-16 sm:py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-6 w-6 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-700">No boards yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Create your first board to get started.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Create board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onOpen={(id) => navigate(`/boards/${id}`)}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateBoardModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      <UserMenu />
    </div>
  );
}
