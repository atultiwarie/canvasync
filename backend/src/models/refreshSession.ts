import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshSession extends Document {
    userId: mongoose.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const refreshSessionSchema = new Schema<IRefreshSession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const refreshSessionModel = mongoose.model<IRefreshSession>('RefreshSession', refreshSessionSchema);
export default refreshSessionModel;