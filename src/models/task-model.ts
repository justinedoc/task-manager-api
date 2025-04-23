import { TaskSchema } from "@/schemas/task-schema.js";
import type { ITaskDoc } from "@/types/tasks-types.js";
import { model } from "mongoose";

const Task = model<ITaskDoc>("Task", TaskSchema);

export default Task;
