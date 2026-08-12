import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "CanvasSync API",
    database: "connected",
    timestamp: new Date().toLocaleString(),
  });
});

export default router;