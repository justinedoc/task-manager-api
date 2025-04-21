import { Document, Schema, Types } from "mongoose";
import { z } from "zod";

export const TaskZodSchema = z.object({
  title: z.string().min(2, "title is required! and can not be a single letter"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  objective: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum(["not started", "in progress", "completed"])
    .default("not started"),
  dueDate: z.date(),
  priority: z.enum(["low", "moderate", "extreme"]).default("low"),
  imgUrl: z.string().url(),
});

export type ITask = z.infer<typeof TaskZodSchema> & {
  user: Types.ObjectId;
  _id: Types.ObjectId;
} & Document;

export const TaskSchema = new Schema<ITask>(
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
