import { api } from "../../lib/api";
import type { CanvasElement } from "../canvas/types/canvas.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Board {
  _id: string;
  title: string;
  description?: string;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardPayload {
  title: string;
  description?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const boardService = {
  async list(): Promise<Board[]> {
    const { data } = await api.get("/api/boards");
    return data.data;
  },

  async create(payload: CreateBoardPayload): Promise<Board> {
    const { data } = await api.post("/api/boards", payload);
    return data.data;
  },

  async get(boardId: string): Promise<Board> {
    const { data } = await api.get(`/api/boards/${boardId}`);
    return data.data;
  },

  async updateMeta(
    boardId: string,
    payload: { title?: string; description?: string }
  ): Promise<Board> {
    const { data } = await api.put(`/api/boards/${boardId}`, payload);
    return data.data;
  },

  async saveElements(boardId: string, elements: CanvasElement[]): Promise<void> {
    await api.put(`/api/boards/${boardId}`, { elements });
  },

  async delete(boardId: string): Promise<void> {
    await api.delete(`/api/boards/${boardId}`);
  },
};
