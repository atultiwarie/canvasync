import { useCanvasStore } from "../state/canvas.store";
import { worldToScreen } from "../engine/coordinates";
import type { RemoteCursor } from "../hooks/useSocket";

function colorForUser(userId: string): string {
  const palette = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#6366f1", "#a855f7", "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

interface RemoteCursorsProps {
  cursors: Map<string, RemoteCursor>;
}

export default function RemoteCursors({ cursors }: RemoteCursorsProps) {
  const camera = useCanvasStore((s) => s.camera);

  if (cursors.size === 0) return null;

  return (
    <>
      {[...cursors.values()].map((cursor) => {
        const screen = worldToScreen({ x: cursor.x, y: cursor.y }, camera);
        const color  = colorForUser(cursor.userId);

        return (
          <div
            key={cursor.userId}
            className="pointer-events-none fixed z-30"
            style={{ left: screen.x, top: screen.y, transform: "translate(-2px, -2px)" }}
          >
            {/* Cursor dot */}
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="4" cy="4" r="4" fill={color} />
            </svg>

            {/* Name label */}
            <div
              className="mt-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
    </>
  );
}
