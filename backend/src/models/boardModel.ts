import mongoose, { Schema, Document } from 'mongoose';

export type BoardRole = 'viewer' | 'editor';

export interface ICollaborator {
    userId: mongoose.Types.ObjectId;
    role: BoardRole;
    joinedAt: Date;
}

export interface IBoardInvite {
    token: string;
    role: BoardRole;
    expiresAt?: Date | null;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
}

export interface IBoard extends Document {
    ownerId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    elements: mongoose.Schema.Types.Mixed[];
    collaborators: ICollaborator[];
    invites: IBoardInvite[];
    createdAt: Date;
    updatedAt: Date;
}

const collaboratorSchema = new Schema<ICollaborator>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['viewer', 'editor'],
            default: 'editor',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const inviteSchema = new Schema<IBoardInvite>(
    {
        token: {
            type: String,
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ['viewer', 'editor'],
            default: 'editor',
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const boardSchema: Schema<IBoard> = new Schema<IBoard>(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        elements: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        collaborators: {
            type: [collaboratorSchema],
            default: [],
        },
        invites: {
            type: [inviteSchema],
            default: [],
        },
    },
    { timestamps: true }
);

// Quickly find all boards a user is involved in
boardSchema.index({ 'collaborators.userId': 1 });

const boardModel = mongoose.model<IBoard>('Board', boardSchema);
export default boardModel;