import jwt , {SignOptions} from 'jsonwebtoken';
import {env} from "../config/env.js";

export interface AccessTokenPayload {
    userId: string;
}

export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
}

export const generateAccessToken =  (userId:string): string =>{
    const payload : AccessTokenPayload = { userId };
    return jwt.sign(payload,
        env.JWT_ACCESS_SECRET,
        {
            expiresIn:env.accessTokenExpiresIn as SignOptions['expiresIn']
        }
    )
}

export const generateRefreshToken = (userId:string, sessionId:string) : string =>{
    const payload : RefreshTokenPayload = { userId, sessionId };
    return jwt.sign(payload,
        env.JWT_REFRESH_SECRET,
        {
            expiresIn:env.refreshTokenExpiresIn as SignOptions['expiresIn']
        }
    )
}

export const verifyAccessToken = (token:string): AccessTokenPayload =>{
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export const verifyRefreshToken = (token:string): RefreshTokenPayload =>{
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}