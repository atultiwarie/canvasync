import crypto from "crypto";
import userModel from "../models/userModel.js";
import refreshSessionModel from "../models/refreshSession.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { env } from "../config/env.js";

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

const hashRefreshToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getRefeshTokenExpiry = (): Date => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + env.refreshTokenExpiresInDays);
  return expiry;
};

export const registerUser = async (data: RegisterData) => {
  const { name, email, password } = data;
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const hashedPassword = await hashPassword(password);
  const user = await userModel.create({
    name,
    email,
    password: hashedPassword,
  });
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

export const loginUser = async (data: LoginData) => {
  const { email, password } = data;
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }
  const session = await refreshSessionModel.create({
    userId: user._id,
    tokenHash: "temporary",
    expiresAt: getRefeshTokenExpiry(),
  });
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(
    user._id.toString(),
    session._id.toString(),
  );
  session.tokenHash = hashRefreshToken(refreshToken);
  await session.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

export const refreshAccessToken = async (refreshToken: string) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const session = await refreshSessionModel.findById(payload.sessionId);

  if (!session) {
    throw new Error("Refresh session not found");
  }

  if (session.revokedAt) {
    throw new Error("Refresh session has been revoked");
  }

  if (session.expiresAt < new Date()) {
    throw new Error("Refresh session has expired");
  }

  const tokenHash = hashRefreshToken(refreshToken);

  if (session.tokenHash !== tokenHash) {
    throw new Error("Invalid refresh token");
  }

  const newAccessToken = generateAccessToken(payload.userId);

  const newRefreshToken = generateRefreshToken(
    payload.userId,
    session._id.toString(),
  );

  session.tokenHash = hashRefreshToken(newRefreshToken);

  session.expiresAt = getRefeshTokenExpiry();

  await session.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (refreshToken: string) => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await refreshSessionModel.findByIdAndUpdate(payload.sessionId, {
      revokedAt: new Date(),
    });
  } catch {
    // Logout should remain successful even if
    // the token is already invalid.
  }
};

export const logoutAllSessions  = async (userId: string) => {
  await refreshSessionModel.updateMany(
    {
      userId,
      revokedAt: null,
    },
    {
      revokedAt: new Date(),
    },
  );
};