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

      socket.emit("board-state", { elements: board.elements ?? [] });
      socket.to(boardId).emit("user-joined", { userId, name });
    });

    socket.on(
      "element-add",
      ({ boardId, element }: { boardId: string; element: CanvasElementPayload }) => {
        socket.to(boardId).emit("element-added", { element, userId, name });
      }
    );

    socket.on(
      "element-update",
      ({
        boardId,
        elementId,
        updates,
      }: {
        boardId: string;
        elementId: string;
        updates: Partial<CanvasElementPayload>;
      }) => {
        socket.to(boardId).emit("element-updated", { elementId, updates, userId });
      }
    );

    socket.on(
      "element-delete",
      ({ boardId, elementId }: { boardId: string; elementId: string }) => {
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
      ({ boardId, elements }: { boardId: string; elements: unknown[] }) => {
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
