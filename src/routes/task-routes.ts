import {
  TASK_CACHE_PREFIX,
  TASKS_CACHE_PREFIX,
} from "@/constants/cache-constants.js";
import { TaskError } from "@/errors/task-error.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import {
  GetAllTasksZodSchema,
  TaskZodSchema,
  TaskZodSchemaForDelete,
  TaskZodSchemaForUpdate,
} from "@/schemas/task-schema.js";
import taskService from "@/services/task-service.js";
import type { ApiResponse } from "@/types/api-res-type.js";
import type { AppBindings } from "@/types/hono-types.js";
import type { TaskListResponse } from "@/types/tasks-types.js";
import { getCacheKey, getCacheOrFetch } from "@/utils/get-cache.js";
import logger from "@/utils/logger.js";
import { wildCardDelCacheKey } from "@/utils/node-cache.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { INTERNAL_SERVER_ERROR, OK } from "stoker/http-status-codes";

const app = new Hono<AppBindings>().basePath("/tasks");

app.use(authMiddleware);

app.post("/add", zValidator("json", TaskZodSchema), async (c) => {
  const { id: userId } = c.get("user");
  const taskDetails = c.req.valid("json");

  try {
    const task = await taskService.create(taskDetails, userId);

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
    if (err instanceof TaskError) {
      logger.warn(err.message);
      return c.json(
        {
          success: false,
          message: err.message,
        },
        err.status
      );
    }

    logger.error(
      err instanceof Error ? err.message : err,
      "Error creating task"
    );

    return c.json(
      {
        success: false,
        message: "An error occurred while creating the task",
      },
      INTERNAL_SERVER_ERROR
    );
  }
});

app.get(
  "/:taskId",
  zValidator("param", TaskZodSchemaForUpdate.pick({ taskId: true })),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const { id: userId } = c.get("user");
    const cacheKey = getCacheKey(TASK_CACHE_PREFIX, { userId, taskId });

    try {
      const task = await getCacheOrFetch(cacheKey, () =>
        taskService.getTaskById(taskId, userId)
      );

      return c.json(
        {
          success: true,
          message: "Task fetched successfully",
          data: { task },
        },
        OK
      );
    } catch (err) {
      if (err instanceof TaskError) {
        logger.warn(err.message);
        return c.json(
          {
            success: false,
            message: err.message,
          },
          err.status
        );
      }
      logger.error(err, "Error fetching task");
      return c.json(
        {
          success: false,
          message: "An error occurred while fetching the task",
        },
        INTERNAL_SERVER_ERROR
      );
    }
  }
);

app.get("/", zValidator("query", GetAllTasksZodSchema), async (c) => {
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
    if (err instanceof TaskError) {
      logger.warn(err.message);
      return c.json(
        {
          success: false,
          message: err.message,
        },
        err.status
      );
    }

    logger.error(err, "Error fetching tasks");

    return c.json(
      {
        success: false,
        message: "An error occurred while fetching tasks",
      },
      INTERNAL_SERVER_ERROR
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
      const task = await taskService.updateTask(taskDetails, taskId);

      wildCardDelCacheKey(TASKS_CACHE_PREFIX(userId.toString()));
      wildCardDelCacheKey(TASK_CACHE_PREFIX);
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
      if (err instanceof TaskError) {
        logger.warn(err.message);
        return c.json(
          {
            success: false,
            message: err.message,
          },
          err.status
        );
      }

      logger.error(err, "Error updating task");
      return c.json(
        {
          success: false,
          message: "An error occurred while updating the task",
        },
        INTERNAL_SERVER_ERROR
      );
    }
  }
);

app.delete(
  "/:taskId",
  zValidator("param", TaskZodSchemaForDelete),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const userId = c.get("user").id;

    try {
      const task = await taskService.deleteTask(taskId, userId);

      wildCardDelCacheKey(TASKS_CACHE_PREFIX(userId.toString()));
      wildCardDelCacheKey(TASK_CACHE_PREFIX);

      return c.json(
        {
          success: true,
          message: "Task deleted successfully",
          data: { task },
        },
        OK
      );
    } catch (err) {
      if (err instanceof TaskError) {
        logger.warn(err.message);
        return c.json(
          {
            success: false,
            message: err.message,
          },
          err.status
        );
      }

      logger.error(err, "Error deleting task");
      return c.json(
        {
          success: false,
          message: "An error occurred while deleting the task",
        },
        INTERNAL_SERVER_ERROR
      );
    }
  }
);

export default app;
