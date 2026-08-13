import dotenv from "dotenv";

dotenv.config();
const requredEnv = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

for (const key of requredEnv) {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is not set`);
    }
}

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  refreshTokenExpiresInDays:
    Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) || 7,
};