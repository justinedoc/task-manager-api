import { TaskSchema, type ITask } from "@/schemas/task-schema.js";
import { model } from "mongoose";

const Task = model<ITask>("Task", TaskSchema);

export default Task;
