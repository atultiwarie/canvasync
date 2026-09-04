import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  boardService,
  type Board,
  type CreateInviteResponse,
} from "../../boards/board.service";

interface ShareModalProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  board,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [expiresIn, setExpiresIn] = useState<"1d" | "7d" | "30d" | "never">(
    "7d",
  );
  const [inviteData, setInviteData] = useState<CreateInviteResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await boardService.createInvite(board._id, {
        role,
        expiresIn,
      });
      setInviteData(res);
    } catch {
      setError("Failed to generate invite link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Re-generate whenever modal opens or role/expiry changes
  useEffect(() => {
    if (isOpen) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role, expiresIn]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInviteData(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyLink = async () => {
    if (!inviteData?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteData.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent — user can select manually */
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${board.title.replace(/\s+/g, "_")}_invite_qr.png`;
        a.click();
      }
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <svg
                className="h-4 w-4"
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
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Share Board
              </h2>
              <p className="max-w-xs truncate text-xs text-slate-500">
                {board.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg
              className="h-4.5 w-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Controls ── */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Permissions
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view only</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Link Expiry
            </label>
            <select
              value={expiresIn}
              onChange={(e) =>
                setExpiresIn(e.target.value as "1d" | "7d" | "30d" | "never")
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10"
            >
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="never">Never expires</option>
            </select>
          </div>
        </div>

        {/* ── Invite Link ── */}
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600">
            Invite Link
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              readOnly
              value={
                loading
                  ? "Generating…"
                  : error
                    ? ""
                    : (inviteData?.inviteUrl ?? "")
              }
              placeholder={error ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none"
            />
            <button
              onClick={copyLink}
              disabled={loading || !!error || !inviteData}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white transition disabled:opacity-40 ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {copied ? (
                <>
                  <svg
                    className="h-3.5 w-3.5"
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
                  Copied!
                </>
              ) : (
                "Copy"
              )}
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>

        {/* ── QR Code ── */}
        <div className="mt-5 flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-5">
          {loading ? (
            <div className="flex h-44 w-44 items-center justify-center">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
            </div>
          ) : error ? (
            <div className="flex h-44 w-44 items-center justify-center text-center">
              <p className="text-xs text-slate-400">
                QR unavailable — try refreshing.
              </p>
            </div>
          ) : inviteData?.inviteUrl ? (
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <QRCodeSVG
                ref={qrRef}
                value={inviteData.inviteUrl}
                size={168}
                level="H"
                includeMargin={false}
              />
            </div>
          ) : null}

          {inviteData && !error && (
            <button
              onClick={downloadQR}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              <svg
                className="h-3.5 w-3.5"
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
              Download QR Image
            </button>
          )}
        </div>

        {/* ── Collaborators list ── */}
        {board.collaborators && board.collaborators.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current members ({board.collaborators.length})
            </h3>
            <div className="mt-2 max-h-28 space-y-2 overflow-y-auto pr-1">
              {board.collaborators.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-slate-700"
                >
                  <span className="truncate">
                    {c.userId?.name || c.userId?.email || "Collaborator"}
                  </span>
                  <span className="ml-2 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-500">
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
