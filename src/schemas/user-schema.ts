import { Schema, Types } from "mongoose";
import z from "zod";
import bcrypt from "bcryptjs";

export const UserZodSchema = z.object({
  firstname: z.string().min(1).max(50),
  lastname: z.string().min(1).max(50),
  username: z.string().min(1).max(50),
  email: z.string().email("Invalid email"),
  phone: z.number().optional(),
  refreshToken: z.string().optional(),
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

export type IUser = z.infer<typeof UserZodSchema> & {
  comparePassword: (password: string) => Promise<boolean>;
  _id: Types.ObjectId;
};

export const UserSchema = new Schema<IUser>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: String,
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};
