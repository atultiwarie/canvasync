import { Router } from "express";
import {
  login,
  register,
  logout,
  logoutAll,
  refresh,
} from "../controllers/auth.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();

router.post("/register", register);
router.post("/login", login);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.post("/logout-all", authMiddleware, logoutAll);

export default router;
