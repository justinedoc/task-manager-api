import Task from "@/models/task-model.js";
import type { FilterQuery } from "mongoose";
import type { GetAllTasksZodSchema } from "@/schemas/task-schema.js";
import type { z } from "zod";
import type { ITaskDoc, ITaskLean } from "@/types/tasks-types.js";
import type { IUserLean } from "@/types/user-type.js";
import { TaskError } from "@/errors/task-error.js";
import { BAD_REQUEST, NOT_FOUND } from "stoker/http-status-codes";

type TNewTask = Omit<ITaskLean, "_id" | "user">;
type TAllTasksQuery = z.infer<typeof GetAllTasksZodSchema>;

class TaskService {
  async create(taskDetails: TNewTask, userId: string) {
    const task = await Task.create({ ...taskDetails, user: userId });
    if (!task) throw new TaskError("Failed to create task", BAD_REQUEST);
    return task;
  }

  async getTaskById(taskId: string, userId: string) {
    const task = await Task.findOne({
      _id: taskId,
      user: userId,
    }).lean<ITaskLean>();

    if (!task) throw new TaskError("Task not found", NOT_FOUND);

    return task;
  }

  async updateTask(
    taskDetails: Partial<TNewTask>,
    taskId: string,
    userId: string
  ) {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: userId },
      taskDetails,
      {
        new: true,
        runValidators: true,
      }
    ).lean<ITaskLean>();

    if (!task) throw new TaskError("Failed to update task", BAD_REQUEST);

    return task;
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await Task.findOneAndDelete(
      {
        _id: taskId,
        user: userId,
      },
      { new: true }
    ).lean<ITaskLean>();

    if (!task)
      throw new TaskError(
        "Failed to delete task or task already deleted",
        NOT_FOUND
      );
    return task;
  }

  async allTasks(query: TAllTasksQuery, userId: string) {
    const {
      status,
      sortOrder,
      dueDate,
      limit,
      page,
      priority,
      search,
      sortBy,
      completed,
    } = query;

    const skip = (page - 1) * limit;

    const sortQuery: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const filterQuery: FilterQuery<ITaskDoc> = {
      user: userId,
      ...(status && { status }),
      ...(typeof completed === "boolean" && { completed }),
      ...(priority && { priority }),
    };

    if (dueDate) {
      const start = new Date(dueDate);
      const end = new Date(dueDate);
      end.setDate(end.getDate() + 1);
      filterQuery.dueDate = { $gte: start, $lt: end };
    }

    if (search) {
      const pattern = new RegExp(search, "i");
      filterQuery.$or = [
        { title: pattern },
        { description: pattern },
        { notes: pattern },
      ];
    }

    const tasks = Task.find(filterQuery)
      .populate<{
        user: IUserLean;
      }>("user", "-refreshToken -comparePassword -__v -password")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = Task.countDocuments(filterQuery).exec();

    const [tasksList, totalCount] = await Promise.all([tasks, total]);

    const hasNextPage = totalCount > page * limit;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;

    return {
      tasks: tasksList || [],
      meta: {
        total: totalCount,
        nextPage,
        prevPage,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}

const taskService = new TaskService();
export default taskService;
