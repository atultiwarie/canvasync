import mongoose, { Schema, Document } from 'mongoose';

export interface IBoard extends Document {
    ownerId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    elements: mongoose.Schema.Types.Mixed[];
    createdAt: Date;
    updatedAt: Date;
}

const boardSchema: Schema<IBoard>= new Schema<IBoard>(
    {
        ownerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index:true
        },
        title:{
            type:String,
            required:true,
            trim:true,
            minlength:3,
            maxlength:100
        },
        description:{
            type:String,
            trim:true,
            maxlength:500
        },
        elements:{
            type:[mongoose.Schema.Types.Mixed],
            default:[]
        }
    },
    {timestamps:true});

const boardModel = mongoose.model<IBoard>('Board', boardSchema);
export default boardModel;