import { useEffect, useRef, useCallback } from "react";
import { getSocket, disconnectSocket } from "../../../lib/socket";
import { useCanvasStore } from "../state/canvas.store";
import type { CanvasElement } from "../types/canvas.types";

export interface RemoteCursor {
  userId: string;
  name: string;
  x: number;
  y: number;
}

export type BoardRole = "owner" | "editor" | "viewer";

export function useSocket(
  boardId: string,
  onCursorUpdate: (cursors: Map<string, RemoteCursor>) => void,
  onRoleReceived?: (role: BoardRole) => void
) {
  const updateElementStore = useCanvasStore((s) => s.updateElement);

  const cursorsRef = useRef<Map<string, RemoteCursor>>(new Map());
  const lastCursorEmit = useRef(0);

  useEffect(() => {
    const socket = getSocket();

    socket.emit("join-board", { boardId });

    const onBoardState = ({
      elements,
      role,
    }: {
      elements: CanvasElement[];
      role?: BoardRole;
    }) => {
      useCanvasStore.getState().loadElements(elements);
      // Notify CanvasPage of this user's role so it can lock the UI
      if (role && onRoleReceived) onRoleReceived(role);
    };

    const onElementAdded = ({ element }: { element: CanvasElement }) => {
      useCanvasStore.setState((s) => ({
        elements: [...s.elements, element],
      }));
    };

    const onElementUpdated = ({
      elementId,
      updates,
    }: {
      elementId: string;
      updates: Partial<CanvasElement>;
    }) => {
      const local = useCanvasStore
        .getState()
        .elements.find((el) => el.id === elementId);

      if (
        local &&
        updates.updatedAt !== undefined &&
        updates.updatedAt < local.updatedAt
      ) {
        return; // Stale update — discard
      }

      updateElementStore(elementId, updates, false /* recordHistory */);
    };

    const onElementDeleted = ({ elementId }: { elementId: string }) => {
      useCanvasStore.setState((s) => ({
        elements: s.elements.filter((el) => el.id !== elementId),
        selectedElementId:
          s.selectedElementId === elementId ? null : s.selectedElementId,
      }));
    };

    const onCursorMoved = (cursor: RemoteCursor) => {
      cursorsRef.current.set(cursor.userId, cursor);
      onCursorUpdate(new Map(cursorsRef.current));
    };

    const onUserLeft = ({ userId }: { userId: string }) => {
      cursorsRef.current.delete(userId);
      onCursorUpdate(new Map(cursorsRef.current));
    };

    socket.on("board-state",     onBoardState);
    socket.on("element-added",   onElementAdded);
    socket.on("element-updated", onElementUpdated);
    socket.on("element-deleted", onElementDeleted);
    socket.on("cursor-moved",    onCursorMoved);
    socket.on("user-left",       onUserLeft);

    return () => {
      socket.off("board-state",     onBoardState);
      socket.off("element-added",   onElementAdded);
      socket.off("element-updated", onElementUpdated);
      socket.off("element-deleted", onElementDeleted);
      socket.off("cursor-moved",    onCursorMoved);
      socket.off("user-left",       onUserLeft);

      socket.emit("leave-board", { boardId });
      disconnectSocket();
    };
  }, [boardId]);

  const emitAdd = useCallback(
    (element: CanvasElement) => {
      getSocket().emit("element-add", { boardId, element });
    },
    [boardId]
  );

  const emitUpdate = useCallback(
    (elementId: string, updates: Partial<CanvasElement>) => {
      getSocket().emit("element-update", { boardId, elementId, updates });
    },
    [boardId]
  );

  const emitDelete = useCallback(
    (elementId: string) => {
      getSocket().emit("element-delete", { boardId, elementId });
    },
    [boardId]
  );

  const emitCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastCursorEmit.current < 33) return; // throttle ~30fps
      lastCursorEmit.current = now;
      getSocket().emit("cursor-move", { boardId, x, y });
    },
    [boardId]
  );

  return { emitAdd, emitUpdate, emitDelete, emitCursor };
}
