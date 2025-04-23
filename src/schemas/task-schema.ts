import type { ITaskDoc } from "@/types/tasks-types.js";
import { Schema } from "mongoose";
import { z } from "zod";

export const GetAllTasksZodSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortBy: z.enum(["title", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  completed: z.coerce.boolean().optional(),
  status: z.enum(["not started", "in progress", "completed"]).optional(),
  priority: z.enum(["low", "moderate", "extreme"]).optional(),
  dueDate: z.coerce.date().optional(),
});

export const TaskZodSchema = z.object({
  title: z.string().min(2, "title is required! and can not be a single letter"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  objective: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum(["not started", "in progress", "completed"])
    .default("not started"),
  dueDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  priority: z.enum(["low", "moderate", "extreme"]).default("low"),
  imgUrl: z.string().url().optional(),
});

export const TaskSchema = new Schema<ITaskDoc>(
  {
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    status: { type: String },
    dueDate: { type: Date, required: true },
    priority: { type: String, required: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
