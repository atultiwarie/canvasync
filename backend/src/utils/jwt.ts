import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

// ─── Existing Payloads ────────────────────────────────────────────────────────

export interface AccessTokenPayload {
    userId: string;
}

export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
}

// ─── Invite Token Payload ─────────────────────────────────────────────────────

export interface InviteTokenPayload {
    boardId: string;
    role: 'viewer' | 'editor';
    type: 'board_invite';
}

// ─── Existing Generators ──────────────────────────────────────────────────────

export const generateAccessToken = (userId: string): string => {
    const payload: AccessTokenPayload = { userId };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.accessTokenExpiresIn as SignOptions['expiresIn'],
    });
};

export const generateRefreshToken = (userId: string, sessionId: string): string => {
    const payload: RefreshTokenPayload = { userId, sessionId };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.refreshTokenExpiresIn as SignOptions['expiresIn'],
    });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

// ─── Invite Token Helpers ─────────────────────────────────────────────────────

export const generateInviteToken = (
    boardId: string,
    role: 'viewer' | 'editor',
    expiresIn: string | number = '7d'
): string => {
    const payload: InviteTokenPayload = {
        boardId,
        role,
        type: 'board_invite',
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: expiresIn as SignOptions['expiresIn'],
    });
};

export const verifyInviteToken = (token: string): InviteTokenPayload => {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as InviteTokenPayload;
    if (payload.type !== 'board_invite') {
        throw new Error('Not an invite token');
    }
    return payload;
};