import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { registerSocketHandlers } from "./socket/socket.handler.js";

connectDB();

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },  
});

registerSocketHandlers(io);

httpServer.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});