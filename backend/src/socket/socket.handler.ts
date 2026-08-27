import type { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "./socket.middleware.js";
import boardModel from "../models/boardModel.js";

interface CanvasElementPayload {
  [key: string]: unknown;
}

const pendingFlushes = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleFlush(boardId: string, elements: unknown[]) {
  const existing = pendingFlushes.get(boardId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    try {
      await boardModel.findByIdAndUpdate(boardId, { elements });
    } catch (err) {
      console.error(`[socket] DB flush failed for board ${boardId}:`, err);
    } finally {
      pendingFlushes.delete(boardId);
    }
  }, 2000);

  pendingFlushes.set(boardId, timer);
}

// Check if a user can mutate elements on a board (owner or editor)
async function canEdit(boardId: string, userId: string): Promise<boolean> {
  const board = await boardModel
    .findById(boardId)
    .select("ownerId collaborators");
  if (!board) return false;

  if (board.ownerId.toString() === userId) return true;

  const collab = board.collaborators.find(
    (c) => c.userId.toString() === userId
  );
  return collab?.role === "editor";
}

export function registerSocketHandlers(io: Server) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    const { userId, name } = socket.data as { userId: string; name: string };

    console.log(`[socket] connected: ${name} (${userId}) — socket ${socket.id}`);

 
    socket.on("join-board", async ({ boardId }: { boardId: string }) => {
      if (!boardId) return;

      const board = await boardModel.findById(boardId);
      if (!board) {
        socket.emit("error", { message: "Board not found" });
        return;
      }

      await socket.join(boardId);
      console.log(`[socket] ${name} joined board ${boardId}`);

      // Tell the joining client the current elements and their own role
      const isOwner = board.ownerId.toString() === userId;
      const collab = board.collaborators.find(
        (c) => c.userId.toString() === userId
      );
      const role = isOwner ? "owner" : collab?.role ?? "viewer";

      socket.emit("board-state", {
        elements: board.elements ?? [],
        role,          // ← frontend uses this to lock down the UI
      });
      socket.to(boardId).emit("user-joined", { userId, name });
    });


    socket.on(
      "element-add",
      async ({
        boardId,
        element,
      }: {
        boardId: string;
        element: CanvasElementPayload;
      }) => {
        if (!(await canEdit(boardId, userId))) {
          socket.emit("error", { message: "Viewers cannot add elements" });
          return;
        }
        socket.to(boardId).emit("element-added", { element, userId, name });
      }
    );

    socket.on(
      "element-update",
      async ({
        boardId,
        elementId,
        updates,
      }: {
        boardId: string;
        elementId: string;
        updates: Partial<CanvasElementPayload>;
      }) => {
        if (!(await canEdit(boardId, userId))) {
          socket.emit("error", { message: "Viewers cannot update elements" });
          return;
        }
        socket.to(boardId).emit("element-updated", { elementId, updates, userId });
      }
    );

    socket.on(
      "element-delete",
      async ({
        boardId,
        elementId,
      }: {
        boardId: string;
        elementId: string;
      }) => {
        if (!(await canEdit(boardId, userId))) {
          socket.emit("error", { message: "Viewers cannot delete elements" });
          return;
        }
        socket.to(boardId).emit("element-deleted", { elementId, userId });
      }
    );


    socket.on(
      "cursor-move",
      ({ boardId, x, y }: { boardId: string; x: number; y: number }) => {
        socket.to(boardId).emit("cursor-moved", { userId, name, x, y });
      }
    );

    socket.on(
      "board-save",
      async ({
        boardId,
        elements,
      }: {
        boardId: string;
        elements: unknown[];
      }) => {
        if (!(await canEdit(boardId, userId))) return;
        scheduleFlush(boardId, elements);
      }
    );

    socket.on("leave-board", ({ boardId }: { boardId: string }) => {
      socket.leave(boardId);
      socket.to(boardId).emit("user-left", { userId, name });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${name} (${userId})`);
      socket.rooms.forEach((room) => {
        socket.to(room).emit("user-left", { userId, name });
      });
    });
  });
}
