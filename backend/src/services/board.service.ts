import mongoose from 'mongoose';
import { randomBytes } from 'crypto';
import boardModel, { type BoardRole } from '../models/boardModel.js';

interface CreateBoardData {
    title: string;
    description?: string;
    ownerId: string;
}

interface UpdateBoardData {
    title?: string;
    description?: string;
    elements?: unknown[];
}



export const createBoard = async ({ title, description, ownerId }: CreateBoardData) => {
    return boardModel.create({ title, description, ownerId });
};

// Get all boards a user owns OR collaborates on
export const getUserBoards = async (userId: string) => {
    return boardModel
        .find({
            $or: [
                { ownerId: userId },
                { 'collaborators.userId': userId },
            ],
        })
        .select('-elements')
        .sort({ updatedAt: -1 });
};

export const getBoardById = async (boardId: string) => {
    const board = await boardModel.findById(boardId);
    if (!board) throw new Error('Board not found');
    return board;
};

// Update board — enforces that viewers cannot save changes
export const updateBoard = async (
    boardId: string,
    data: UpdateBoardData,
    userId?: string
) => {
    if (userId) {
        const board = await boardModel.findById(boardId);
        if (!board) throw new Error('Board not found');

        const isOwner = board.ownerId.toString() === userId;
        const collab = board.collaborators.find((c) => c.userId.toString() === userId);

        if (!isOwner && (!collab || collab.role !== 'editor')) {
            throw new Error('Forbidden: viewers cannot edit this board');
        }
    }

    const updated = await boardModel.findByIdAndUpdate(boardId, data, {
        new: true,
        runValidators: true,
    });
    if (!updated) throw new Error('Board not found');
    return updated;
};

export const deleteBoard = async (boardId: string, ownerId: string) => {
    const board = await boardModel.findOneAndDelete({ _id: boardId, ownerId });
    if (!board) throw new Error('Board not found');
    return board;
};



type ExpiresInOption = '1d' | '7d' | '30d' | 'never';

// Generate a short, clean random token (32 hex chars = 16 bytes)
// e.g.  a3f2b1c9d4e5f6a7b8c9d0e1f2a3b4c5
function generateShortToken(): string {
    return randomBytes(16).toString('hex');
}

export const createBoardInvite = async (
    boardId: string,
    userId: string,
    role: BoardRole = 'editor',
    expiresInOption: ExpiresInOption = '7d'
) => {
    const board = await boardModel.findById(boardId);
    if (!board) throw new Error('Board not found');

    const isOwner = board.ownerId.toString() === userId;
    const isEditor = board.collaborators.some(
        (c) => c.userId.toString() === userId && c.role === 'editor'
    );
    if (!isOwner && !isEditor) {
        throw new Error('Only owners and editors can generate invite links');
    }

    // Build expiry date
    let expiresAt: Date | null = null;
    if (expiresInOption !== 'never') {
        const days = expiresInOption === '1d' ? 1 : expiresInOption === '7d' ? 7 : 30;
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    // Short random token — boardId + role are stored in the DB record, NOT encoded in the URL
    const token = generateShortToken();

    board.invites.push({
        token,
        role,
        expiresAt,
        createdAt: new Date(),
        createdBy: new mongoose.Types.ObjectId(userId),
    });
    await board.save();

    return { token, role, expiresAt };
};

// Join via short token — DB lookup, no JWT decode
export const joinBoardByToken = async (token: string, userId: string) => {
    // Find any board that has this invite token
    const board = await boardModel.findOne({ 'invites.token': token });
    if (!board) throw new Error('Invalid or expired invite link');

    const invite = board.invites.find((inv) => inv.token === token);
    if (!invite) throw new Error('Invalid or expired invite link');

    // Check expiry
    if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new Error('This invite link has expired');
    }

    const { role } = invite;

    // Already the owner
    if (board.ownerId.toString() === userId) {
        return { board, alreadyMember: true, role: 'owner' as const };
    }

    // Already a collaborator — upgrade viewer → editor if applicable
    const existingIndex = board.collaborators.findIndex(
        (c) => c.userId.toString() === userId
    );
    if (existingIndex !== -1) {
        if (role === 'editor' && board.collaborators[existingIndex].role === 'viewer') {
            board.collaborators[existingIndex].role = 'editor';
            await board.save();
        }
        return { board, alreadyMember: true, role: board.collaborators[existingIndex].role };
    }

    // New collaborator
    board.collaborators.push({
        userId: new mongoose.Types.ObjectId(userId),
        role: role ?? 'editor',
        joinedAt: new Date(),
    });
    await board.save();

    return { board, alreadyMember: false, role };
};

// Remove collaborator (owner only)
export const removeCollaborator = async (
    boardId: string,
    ownerId: string,
    targetUserId: string
) => {
    const board = await boardModel.findById(boardId);
    if (!board) throw new Error('Board not found');

    if (board.ownerId.toString() !== ownerId) {
        throw new Error('Only the board owner can remove collaborators');
    }

    board.collaborators = board.collaborators.filter(
        (c) => c.userId.toString() !== targetUserId
    );
    await board.save();
    return board;
};

// Utility: get the effective role of a user on a board
export const getUserRoleOnBoard = async (
    boardId: string,
    userId: string
): Promise<'owner' | 'editor' | 'viewer' | null> => {
    const board = await boardModel.findById(boardId).select('ownerId collaborators');
    if (!board) return null;

    if (board.ownerId.toString() === userId) return 'owner';

    const collab = board.collaborators.find((c) => c.userId.toString() === userId);
    if (collab) return collab.role;

    return null; // no access
};