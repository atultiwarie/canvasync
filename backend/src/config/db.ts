import mongoose from "mongoose";
import{env} from "./env.js";
export const connectDB = async ()=>{
    try{
        await mongoose.connect(env.MONGO_URI as string);
        console.log("MongoDB connected successfully");

    }catch(err){
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
}
