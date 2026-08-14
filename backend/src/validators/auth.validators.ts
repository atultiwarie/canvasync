import {z} from "zod";

export const registerSchema = z.object({
    name:z
    .string()
    .trim()
    .min(2, {message: "Name must be at least 2 characters long"})
    .max(50, {message: "Name must be at most 50 characters long"}),

    email:z
    .string()
    .trim()
    .email({message: "Invalid email address"})
    .transform((email) => email.toLowerCase()),

    password:z
    .string()
    .min(8, {message: "Password must be at least 8 characters long"})
    .max(100, {message: "Password must be at most 100 characters long"})
})


export const loginSchema = z.object({
    email:z
    .string()
    .trim()
    .email({message: "Invalid email address"})
    .transform((email) => email.toLowerCase()),
    password:z
    .string()
    .min(1, "Password is required")
    
})