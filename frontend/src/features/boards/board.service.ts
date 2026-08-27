import { api } from "../../lib/api";
import type { CanvasElement } from "../canvas/types/canvas.types";



export interface BoardMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Collaborator {
  userId: BoardMember;
  role: "viewer" | "editor";
  joinedAt: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  elements: CanvasElement[];
  ownerId: BoardMember | string;
  collaborators?: Collaborator[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardPayload {
  title: string;
  description?: string;
}

// Phase 4 types
export interface CreateInviteResponse {
  token: string;
  role: "viewer" | "editor";
  expiresAt: string | null;
  inviteUrl: string;
}

export interface JoinBoardResponse {
  boardId: string;
  title: string;
  role: "viewer" | "editor" | "owner";
}


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

  // ─── Phase 4 ───────────────────────────────────────────────────────────────

  async createInvite(
    boardId: string,
    payload: {
      role?: "viewer" | "editor";
      expiresIn?: "1d" | "7d" | "30d" | "never";
    } = {}
  ): Promise<CreateInviteResponse> {
    const { data } = await api.post(`/api/boards/${boardId}/invite`, {
      role: payload.role ?? "editor",
      expiresIn: payload.expiresIn ?? "7d",
    });
    return data.data;
  },

  async join(token: string): Promise<JoinBoardResponse> {
    const { data } = await api.post(`/api/boards/join/${token}`);
    return data.data;
  },

  async removeCollaborator(boardId: string, targetUserId: string): Promise<void> {
    await api.delete(`/api/boards/${boardId}/collaborators/${targetUserId}`);
  },
};
