import { z } from "zod";

export const createBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),

  description: z
    .string()
    .trim()
    .max(500, { message: "Description must be at most 500 characters long" })
    .optional(),
});

export const updateBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Board title is required")
    .max(100, "Board title cannot exceed 100 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});
