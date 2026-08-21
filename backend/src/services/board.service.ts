import boardModel from '../models/boardModel.js';

interface CreateBoardData{
    title: string;
    description?: string;
    ownerId: string;
}

interface UpdateBoardData{
    title?: string;
    description?: string;
    elements?: unknown[];
}

// create a new board
export const createBoard = async ({title, description, ownerId}: CreateBoardData) => {
    const board = await boardModel.create(
        {
            title,
            description,
            ownerId
        }
    );
    return board;

}

// get all boards for a user (elements excluded — too large for a list)
export const getUserBoards = async (ownerId: string) => {

  return boardModel.find({
    ownerId,
  })
  .select('-elements')
  .sort({
    updatedAt: -1,
  });
};

// get a board by id (allows collaborators to view any board by link)
export const getBoardById = async (
    boardId: string
)=>{
    const board = await boardModel.findById(boardId);
    if(!board){
        throw new Error("Board not found");
    }
    return board;
}

// update a board by id (allows collaborators to save edits)
export const updateBoard = async (
    boardId: string,
    data: UpdateBoardData
)=>{
    const board = await boardModel.findByIdAndUpdate(
        boardId,
        data,
        {
            new: true,
            runValidators: true
        }
    );
    if(!board){
        throw new Error("Board not found");
    }
    return board;
}

// delete a board by id
export const deleteBoard = async (
    boardId: string,
    ownerId: string
)=>{
    const board = await boardModel.findOneAndDelete({
        _id: boardId,
        ownerId
    });
    if(!board){
        throw new Error("Board not found");
    }
    return board;
}