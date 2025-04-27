import { TaskZodSchema } from "@/schemas/task-schema.js";
import { createRoute, z } from "@hono/zod-openapi";

export const addTask = createRoute({
  method: "post",
  path: "/add",
  request: {
    body: { content: { "application/json": { schema: TaskZodSchema } } },
  },
  responses: {
    200: {
      description: "Task created successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.object({ task: z.any() }),
          }),
        },
      },
    },
  },
});
