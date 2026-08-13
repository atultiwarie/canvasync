import {NextFunction, Request, Response} from "express";
import {verifyAccessToken} from "../utils/jwt.js";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction)=> {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader){
            res.status(401).json({
                success: false,
                message: "Authorization header missing",
            });
            return;
        }

        const [scheme, token] = authHeader.split(" ");
        if(scheme !== "Bearer" || !token){
            res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
            return;
        }

        const payload = await verifyAccessToken(token);
        req.user = {
            userId: payload.userId,
   
        };
        next();
    }catch{
        res.status(401).json({
          success: false,
          message: "Invalid or expired access token",
        });
    }
}