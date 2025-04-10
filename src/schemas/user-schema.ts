import { Document, Schema } from "mongoose";
import z from "zod";

export const UserZodSchema = z.object({
  firstname: z.string().min(1).max(50),
  lastname: z.string().min(1).max(50),
  username: z.string().min(1).max(50),
  email: z.string().email("Invalid email"),
  phone: z.number().optional(),
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

export type IUser = z.infer<typeof UserZodSchema> & Document;

export const UserSchema = new Schema<IUser>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);
