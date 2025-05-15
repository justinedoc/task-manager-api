import type { IAdminDoc } from "@/types/admin-types.js";
import { Schema } from "mongoose";
import z from "zod";

export const AdminZodSchema = z.object({
  role: z.enum(["ADMIN"]).default("ADMIN"),
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

export const AdminSchema = new Schema<IAdminDoc>(
  {
    role: { type: String, required: true, enum: ["ADMIN"], default: "ADMIN" },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImg: String,
    refreshToken: { type: [String], default: [] },
  },
  { timestamps: true }
);
