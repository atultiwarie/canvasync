import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { boardService } from "../board.service";
import { useAuthStore } from "../../auth/auth.store";

type JoinStatus = "verifying" | "success" | "error";

export default function JoinBoardPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [status, setStatus] = useState<JoinStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No invite token provided.");
      return;
    }

    // If the user isn't logged in, send them to /login and come back here after
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: `/join/${token}` } },
        replace: true,
      });
      return;
    }

    boardService
      .join(token)
      .then((res) => {
        setStatus("success");
        // Short pause so the user sees the success state
        setTimeout(() => {
          navigate(`/boards/${res.boardId}`, { replace: true });
        }, 1200);
      })
      .catch((err) => {
        setStatus("error");
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Invalid or expired invite link.";
        setErrorMessage(msg);
      });
  }, [token, isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        {/* ── Logo ── */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow">
            <svg
              className="h-5 w-5 text-white"
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
        </div>

        {/* ── Verifying ── */}
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Joining board…
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Verifying your invite
              </p>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Joined successfully!
            </h2>
            <p className="text-xs text-slate-500">
              Redirecting to your canvas…
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Invite link error
              </h2>
              <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
            </div>
            <button
              onClick={() => navigate("/boards")}
              className="mt-1 w-full rounded-lg bg-slate-900 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
            >
              Back to my boards
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

