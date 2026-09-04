import type { Request, Response } from "express";
import boardModel  from "../models/boardModel.js";
import { summarizeBoardVision } from "../services/ai.service.js";


export const summarizeBoardController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user?.userId;
    const { image, boardTitle } = req.body as {
      image?: string;
      boardTitle?: string;
    };

    // ── Validate payload ──────────────────────────────────────────────────────
    if (!image || typeof image !== "string") {
      res.status(400).json({
        success: false,
        message: "Missing required field: image (base64 PNG data URL).",
      });
      return;
    }

    if (!image.startsWith("data:image/")) {
      res.status(400).json({
        success: false,
        message: "image must be a valid base64 data URL (data:image/png;base64,...).",
      });
      return;
    }

    // Rough size guard: base64 PNG should be under ~15 MB raw
    if (image.length > 20_000_000) {
      res.status(413).json({
        success: false,
        message: "Board image too large. Try zooming in to a smaller area before summarizing.",
      });
      return;
    }

    // ── Verify board access ───────────────────────────────────────────────────
    const board = await boardModel.findById(boardId);
    if (!board) {
      res.status(404).json({ success: false, message: "Board not found." });
      return;
    }

    const isOwner = board.ownerId.toString() === userId;
    const isCollaborator = board.collaborators?.some(
      (c) => c.userId.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        success: false,
        message: "You do not have access to this board.",
      });
      return;
    }

    // ── Call AI service ───────────────────────────────────────────────────────
    const result = await summarizeBoardVision(image, boardTitle ?? board.title);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "AI_NOT_CONFIGURED") {
      res.status(503).json({
        success: false,
        message:
          "AI service is not configured. Please set GEMINI_API_KEY in the server environment.",
      });
      return;
    }

    console.error("[AI summarize]", message);
    res.status(500).json({
      success: false,
      message: "AI summarization failed. Please try again.",
    });
  }
};

