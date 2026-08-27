import { z } from 'zod';

export const createBoardSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, { message: 'Title must be at least 3 characters long' })
        .max(100, { message: 'Title must be at most 100 characters long' }),

    description: z
        .string()
        .trim()
        .max(500, { message: 'Description must be at most 500 characters long' })
        .optional(),
});

export const updateBoardSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Board title is required')
        .max(100, 'Board title cannot exceed 100 characters')
        .optional(),

    description: z
        .string()
        .trim()
        .max(500, 'Description cannot exceed 500 characters')
        .optional(),

    elements: z.array(z.any()).optional(),
});

// Phase 4: invite link validation
export const createInviteSchema = z.object({
    role: z.enum(['viewer', 'editor']).default('editor'),
    expiresIn: z.enum(['1d', '7d', '30d', 'never']).default('7d'),
});
