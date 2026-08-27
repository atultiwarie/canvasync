import { Request, Response } from "express";
import {
  createBoard,
  deleteBoard,
  getBoardById,
  getUserBoards,
  updateBoard,
  createBoardInvite,
  joinBoardByToken,
  removeCollaborator,
} from "../services/board.service.js";
import boardModel from "../models/boardModel.js";

// POST /api/boards
export const createBoardController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { title, description } = req.body;
    const board = await createBoard({ title, description, ownerId: userId });

    res.status(201).json({
      success: true,
      message: "Board created successfully",
      data: board,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create board";
    res.status(400).json({ success: false, message });
  }
};

// GET /api/boards
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const totalBoards = await boardModel.countDocuments({
      $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
    });

    const boards = await getUserBoards(userId);

    res.status(200).json({
      success: true,
      message: "Boards fetched successfully",
      total: totalBoards,
      data: boards,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch boards";
    res.status(500).json({ success: false, message });
  }
};

// GET /api/boards/:boardId
export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const board = await getBoardById(req.params.boardId as string);

    res.status(200).json({
      success: true,
      message: "Board fetched successfully",
      data: board,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch board";
    res.status(500).json({ success: false, message });
  }
};

// PUT /api/boards/:boardId
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const board = await updateBoard(req.params.boardId as string, req.body, userId);

    res.status(200).json({
      success: true,
      message: "Board updated successfully",
      data: board,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update board";
    res.status(500).json({ success: false, message });
  }
};

// DELETE /api/boards/:boardId
export const deleteById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await deleteBoard(req.params.boardId as string, userId);

    res.status(200).json({
      success: true,
      message: "Board deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete board";
    res.status(500).json({ success: false, message });
  }
};



// POST /api/boards/:boardId/invite
export const createInviteController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const boardId = req.params.boardId as string;
    const { role, expiresIn } = req.body;

    const invite = await createBoardInvite(boardId, userId, role, expiresIn);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const inviteUrl = `${clientUrl}/join/${invite.token}`;

    res.status(200).json({
      success: true,
      message: "Invite link generated successfully",
      data: {
        token: invite.token,
        role: invite.role,
        expiresAt: invite.expiresAt,
        inviteUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create invite";
    res.status(400).json({ success: false, message });
  }
};

// POST /api/boards/join/:token
export const joinBoardController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const token = req.params.token as string;
    const result = await joinBoardByToken(token, userId);

    res.status(200).json({
      success: true,
      message: result.alreadyMember
        ? "Already a member of this board"
        : "Joined board successfully",
      data: {
        boardId: result.board._id,
        title: result.board.title,
        role: result.role,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to join board";
    res.status(400).json({ success: false, message });
  }
};

// DELETE /api/boards/:boardId/collaborators/:targetUserId
export const removeCollaboratorController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const boardId = req.params.boardId as string;
    const targetUserId = req.params.targetUserId as string;
    await removeCollaborator(boardId, userId, targetUserId);

    res.status(200).json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to remove collaborator";
    res.status(400).json({ success: false, message });
  }
};
