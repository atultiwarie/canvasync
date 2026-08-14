import express from "express";
const app = express();
import cors from "cors";
import helmet from "helmet";
import healthroute from "./routes/health.routes.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";




// middlewares
app.use(cors({
    origin:['http://localhost:5173'],
    credentials:true,
}));
app.use(express.json());
app.use(helmet());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CanvasSync API",
  });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/health",healthroute)


app.use(errorHandler);


export default app;