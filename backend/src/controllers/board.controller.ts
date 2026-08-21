import {Request, Response} from "express";
import { createBoard,
  deleteBoard,
  getBoardById,
  getUserBoards,
  updateBoard } from "../services/board.service.js";
import boardModel from "../models/boardModel.js";

// create a new board

export const createBoardController = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
       
        const { title, description } = req.body;
        const board = await createBoard({
            title,
            description,
            ownerId:userId
        })

        res.status(201).json({
            success: true,
            message: "Board created successfully",
            data: board
        });

    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create board";

      res.status(400).json({
        success: false,
        message,
      });
    }
}

// get all boards for a user
export const getAll = async(req:Request,res:Response):Promise<void>=>{
    try {
        
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
          const totalBoards = await boardModel.countDocuments({
            ownerId: userId
          });
    
        const boards = await getUserBoards(userId);
        
        res.status(200).json({
            success: true,
            message: "Boards fetched successfully",
            total: totalBoards,
            data: boards,
        });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch boards";

      res.status(500).json({
        success: false,
        message,
      });
    }

}

// get a board by id
export const getOne = async (req: Request, res: Response) : Promise<void> => {
    try{
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        const board = await getBoardById(
            req.params.boardId as string
        )
        res.status(200).json({
            success: true,
            message: "Board fetched successfully",
            data: board
        });

    }catch (error) {
        const message =
        error instanceof Error ? error.message : "Unable to fetch board";
        res.status(500).json({
            success: false,
            message
        });
    }
}

// update a board by id
export const update = async (req: Request, res: Response) : Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        const board = await updateBoard(
            req.params.boardId as string,
            req.body
        )
        res.status(200).json({
            success: true,
            message: "Board updated successfully",
            data: board
        });

    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch board";
      res.status(500).json({
        success: false,
        message,
      });
    }
}

// delete a board by id
export const deleteById = async (req: Request, res: Response) : Promise<void> => {
    try{
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        await deleteBoard(
            req.params.boardId as string,
            userId
        )
        res.status(200).json({
            success: true,
            message: "Board deleted successfully",
        });
     } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch board";
      res.status(500).json({
        success: false,
        message,
      });
    }
}