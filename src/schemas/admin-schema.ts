import {
  GetByIdZodSchemaFactory,
  UpdateUserDataZodSchemaFactory,
  UsersZodSchemaFactory,
} from "@/schemas/schema-factory.js";
import type { IAdminDoc } from "@/types/admin-types.js";
import { isValidObjectId, Schema } from "mongoose";
import z from "zod";

export const GetAdminByIdZodSchema = GetByIdZodSchemaFactory("ADMIN");

const UpdateAdminDataZodSchema = UpdateUserDataZodSchemaFactory();

export const UpdateAdminZodSchema = z.object({
  id: z.string().refine(isValidObjectId, {
    message: "Invalid user ID format",
  }),
  data: UpdateAdminDataZodSchema,
});

export const AdminZodSchema = UsersZodSchemaFactory().extend({
  role: z.enum(["ADMIN"]).default("ADMIN"),
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
