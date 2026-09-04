import { Router } from "express";
import {
  createBoardController,
  getAll,
  getOne,
  update,
  deleteById,
  createInviteController,
  joinBoardController,
  removeCollaboratorController,
} from "../controllers/board.controller.js";
import { summarizeBoardController } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createBoardSchema,
  updateBoardSchema,
  createInviteSchema,
} from "../validators/board.validator.js";

const router = Router();

router.use(authMiddleware);

// ─── Board CRUD ───────────────────────────────────────────────────────────────
router.post("/", validate(createBoardSchema), createBoardController);
router.get("/", getAll);
router.get("/:boardId", getOne);
router.put("/:boardId", validate(updateBoardSchema), update);
router.delete("/:boardId", deleteById);

// ─── Phase 4: Invites & Collaboration ────────────────────────────────────────

router.post("/join/:token", joinBoardController);
router.post(
  "/:boardId/invite",
  validate(createInviteSchema),
  createInviteController,
);
router.delete(
  "/:boardId/collaborators/:targetUserId",
  removeCollaboratorController,
);

// ─── Phase 6: AI Summarization ────────────────────────────────────────────────
router.post("/:boardId/ai/summarize", summarizeBoardController);

export default router;
