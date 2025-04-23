import type { Types } from "mongoose";
import type { z } from "zod";
import type { TaskZodSchema } from "@/schemas/task-schema.js";
import type { Document } from "mongoose";
import type { IUserLean } from "@/types/user-type.js";

type BaseTask = z.infer<typeof TaskZodSchema> & {
  user: Types.ObjectId;
  _id: Types.ObjectId;
};

export type ITaskLean = Omit<BaseTask, "user"> & {
  user: IUserLean
};
export type ITaskDoc = BaseTask & Document;

export type TaskListMeta = {
  total: number;
  nextPage: number | null;
  prevPage: number | null;
  page: number;
  limit: number;
  totalPages: number;
};

export type TaskListResponse = {
  tasks: ITaskLean[];
  meta: TaskListMeta;
};
