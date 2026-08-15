import {Router} from "express";
import{
    createBoardController,
    getAll,
    getOne,
    update,
    deleteById
}from "../controllers/board.controller.js"

import { authMiddleware } from "../middleware/auth.middleware.js";

import {validate} from "../middleware/validate.middleware.js";
import { createBoardSchema, updateBoardSchema } from "../validators/board.validator.js";

const router = Router();

router.use(authMiddleware);

router.post(
    "/",
    validate(createBoardSchema),
    createBoardController
)

router.get(
    "/",
    getAll
)

router.get(
    "/:boardId",
    getOne
)

router.put(
    "/:boardId",
    validate(updateBoardSchema),
    update
)

router.delete(
    "/:boardId",
    deleteById
)

export default router;