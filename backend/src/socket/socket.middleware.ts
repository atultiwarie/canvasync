import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import userModel from "../models/userModel.js";

interface AccessTokenPayload {
  userId: string;
}


export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error("Unauthorized: no token provided"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

    const user = await userModel.findById(payload.userId).select("name email");
    if (!user) {
      return next(new Error("Unauthorized: user not found"));
    }

    socket.data.userId = String(user._id);
    socket.data.name   = user.name;
    socket.data.email  = user.email;

    next();
  } catch {
    next(new Error("Unauthorized: invalid or expired token"));
  }
}
