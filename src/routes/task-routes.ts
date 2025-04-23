import { TASKS_CACHE_PREFIX } from "@/constants/cache-constants.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import {
  GetAllTasksZodSchema,
  TaskZodSchema,
  TaskZodSchemaForUpdate,
} from "@/schemas/task-schema.js";
import taskService from "@/services/task-service.js";
import type { ApiResponse } from "@/types/api-res-type.js";
import type { Variables } from "@/types/hono-types.js";
import type { TaskListResponse } from "@/types/tasks-types.js";
import { getCacheKey, getCacheOrFetch } from "@/utils/get-cache.js";
import logger from "@/utils/logger.js";
import { wildCardDelCacheKey } from "@/utils/node-cache.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { OK } from "stoker/http-status-codes";

const app = new Hono<{ Variables: Variables }>();

app.use(authMiddleware);

app.post("/new", zValidator("json", TaskZodSchema), async (c) => {
  const { id: userId } = c.get("user");
  const taskDetails = c.req.valid("json");

  try {
    const task = await taskService.create(taskDetails, userId);

    if (!task) {
      return c.json(
        {
          success: false,
          message: "Failed to create task",
        },
        500
      );
    }

    wildCardDelCacheKey(TASKS_CACHE_PREFIX(userId.toString()));
    logger.info(`Cache cleared for user ${userId}`);

    return c.json(
      {
        success: true,
        message: "Task created successfully",
        data: { task },
      },
      OK
    );
  } catch (err) {
    logger.error(
      err instanceof Error ? err.message : err,
      "Error creating task"
    );
    return c.json(
      {
        success: false,
        message: "An error occurred while creating the task",
      },
      500
    );
  }
});

app.get("/all", zValidator("query", GetAllTasksZodSchema), async (c) => {
  const { id: userId } = c.get("user");
  const query = c.req.valid("query");
  const cacheKey = getCacheKey(TASKS_CACHE_PREFIX(userId.toString()), query);

  try {
    const data = await getCacheOrFetch(cacheKey, () =>
      taskService.allTasks(query, userId)
    );

    const result: ApiResponse<TaskListResponse> = {
      success: true,
      message: "Tasks fetched successfully",
      data,
    };

    return c.json(result, OK);
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

app.patch(
  "/:taskId",
  zValidator("param", TaskZodSchemaForUpdate.pick({ taskId: true })),
  zValidator("json", TaskZodSchemaForUpdate.omit({ taskId: true })),
  async (c) => {
    const { id: userId } = c.get("user");
    const { taskId } = c.req.valid("param");
    const taskDetails = c.req.valid("json");

    try {
      const task = await taskService.updateTask(taskId, taskDetails);
      if (!task) {
        return c.json(
          {
            success: false,
            message: "Failed to update task",
          },
          500
        );
      }

      wildCardDelCacheKey(TASKS_CACHE_PREFIX(userId.toString()));
      logger.info(`Cache cleared for user ${userId}`);

      return c.json(
        {
          success: true,
          message: "Task updated successfully",
          data: { task },
        },
        OK
      );
    } catch (err) {
      logger.error(
        err instanceof Error ? err.message : err,
        "Error updating task"
      );
      return c.json(
        {
          success: false,
          message: "An error occurred while updating the task",
        },
        500
      );
    }
  }
);
export default app;
