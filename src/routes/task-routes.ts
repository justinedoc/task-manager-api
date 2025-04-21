import { authMiddleware } from "@/middlewares/auth-middleware.js";
import Task from "@/models/task-model.js";
import { GetAllTasksZodSchema, type ITask } from "@/schemas/task-schema.js";
import type { IUser } from "@/schemas/user-schema.js";
import type { Variables } from "@/types/hono-types.js";
import { getCacheKey, getCacheOrFetch } from "@/utils/get-cache.js";
import logger from "@/utils/logger.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { FilterQuery } from "mongoose";
import { OK } from "stoker/http-status-codes";

export const TASK_CACHE_PREFIX = "task";
export const TASKS_CACHE_PREFIX = "tasks";

const app = new Hono<{ Variables: Variables }>();

app.use(authMiddleware);

app.get("/", zValidator("query", GetAllTasksZodSchema), async (c) => {
  const { id: userId } = c.get("user");
  const cacheKey = getCacheKey(TASKS_CACHE_PREFIX, {
    userId,
    ...c.req.valid("query"),
  });

  try {
    const data = await getCacheOrFetch(cacheKey, async () => {
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
      } = c.req.valid("query");

      const skip = (page - 1) * limit;

      const sortQuery: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const filterQuery: FilterQuery<ITask> = {
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
          user: IUser;
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
    });

    return c.json(
      {
        success: true,
        message: "Tasks fetched successfully",
        data,
      },
      OK
    );
  } catch (err) {
    logger.error(
      err instanceof Error ? err.message : err,
      "Error fetching tasks"
    );
    return c.json(
      {
        success: false,
        message: "An error occurred while fetching tasks",
      },
      500
    );
  }
});

export default app;
