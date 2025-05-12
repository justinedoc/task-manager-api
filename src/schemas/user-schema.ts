import { Schema } from "mongoose";
import z from "zod";
import { isValidObjectId } from "mongoose";
import type { IUserDoc } from "@/types/user-type.js";

// User login schema
export const UserLoginZodSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Zod schema for getting user by ID
export const GetUserByIdZodSchema = z.object({
  id: z
    .string({ required_error: "User ID is required" })
    .refine(isValidObjectId, { message: "Invalid user ID format" }),
});

// Zod schema for updating user data
const UpdateUserDataZodSchema = z
  .object({
    firstname: z.string().min(1).max(50),
    lastname: z.string().min(1).max(50),
    username: z.string().min(1).max(50),
    email: z.string().email("Invalid email"),
  })
  .partial();

export const UpdateUserZodSchema = z.object({
  id: z.string().refine(isValidObjectId, {
    message: "Invalid user ID format",
  }),
  data: UpdateUserDataZodSchema,
});

export const UserZodSchema = z.object({
  role: z.enum(["USER"]).default("USER"),
  firstname: z.string().min(1).max(50),
  lastname: z.string().min(1).max(50),
  username: z.string().max(50).optional(),
  email: z.string().email("Invalid email"),
  refreshToken: z.array(z.string()).optional(),
  profileImg: z.string().optional(),
  password: z
    .string()
    .min(8)
    .max(50)
    .refine((val) => {
      return (
        /[a-zA-Z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*]/.test(val)
      );
    }, "Password must contain at least one letter, one number, and one special character"),
});

export const UserPasswordUpdateZodSchema = z.object({
  oldPassword: z.string().min(8).max(50),
  newPassword: z
    .string()
    .min(8)
    .max(50)
    .refine((val) => {
      return (
        /[a-zA-Z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*]/.test(val)
      );
    }, "New password must contain at least one letter, one number, and one special character"),
});

// User schema for MongoDB
export const UserSchema = new Schema<IUserDoc>(
  {
    role: { type: String, default: "USER" },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task", default: [] }],
    profileImg: String,
    refreshToken: { type: [String], default: [] },
  },
  { timestamps: true }
);
