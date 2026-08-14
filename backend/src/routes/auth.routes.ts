import { Router } from "express";
import {
  login,
  register,
  logout,
  logoutAll,
  refresh,
  getMe,
} from "../controllers/auth.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";
const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.post("/logout-all", authMiddleware, logoutAll);

router.get("/me", authMiddleware, getMe);

export default router;
