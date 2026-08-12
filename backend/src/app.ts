import express from "express";
const app = express();
import cors from "cors";
import helmet from "helmet";
import healthroute from "./routes/health.routes.js";


// middlewares
app.use(cors({
    origin:['http://localhost:5173'],
    credentials:true,
}));
app.use(express.json());

app.use(helmet());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CanvasSync API",
  });
});

app.use("/api/health",healthroute)


export default app;