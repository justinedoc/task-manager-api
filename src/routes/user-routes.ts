import { USER_CACHE_PREFIX } from "@/constants/cache-constants.js";
import { AuthError } from "@/errors/auth-error.js";
import {
  authMiddleware,
  isSelfOrAdmin,
} from "@/middlewares/auth-middleware.js";
import {
  GetUserByIdZodSchema,
  UpdateUserZodSchema,
} from "@/schemas/user-schema.js";
import userService from "@/services/user-service.js";
import type { AppBindings } from "@/types/hono-types.js";
import { getCacheKey, getCacheOrFetch } from "@/utils/get-cache.js";
import logger from "@/utils/logger.js";
import { wildCardDelCacheKey } from "@/utils/node-cache.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { FORBIDDEN, INTERNAL_SERVER_ERROR, OK } from "stoker/http-status-codes";

const unauthorizedRes = {
  success: false,
  message: "You are forbidden to perform this action",
};

const app = new Hono<AppBindings>().basePath("/user");

app.use(authMiddleware);

// get user by id
app.get("/:id", zValidator("param", GetUserByIdZodSchema), async (c) => {
  const { id } = c.req.valid("param");
  const { id: userId, role } = c.get("user");
  const cacheKey = getCacheKey("user", { userId });

  try {
    if (!isSelfOrAdmin({ userId, id, role })) {
      throw new AuthError(unauthorizedRes.message, FORBIDDEN);
    }
    const user = await getCacheOrFetch(
      cacheKey,
      async () => await userService.getById(userId)
    );

    return c.json(
      {
        success: true,
        message: "User fetched successfully",
        data: { user },
      },
      OK
    );
  } catch (error) {
    if (error instanceof AuthError) {
      logger.warn(error.message, "Error fetching user by ID");
      return c.json(
        {
          success: false,
          message: error.message,
        },
        error.status
      );
    }

    logger.error(error, "Error fetching user by ID");

    return c.json(
      {
        success: false,
        message: "Error fetching user",
      },
      INTERNAL_SERVER_ERROR
    );
  }
});

// update user
app.patch(
  "/:id",
  zValidator("param", UpdateUserZodSchema.pick({ id: true })),
  zValidator("json", UpdateUserZodSchema.omit({ id: true })),
  async (c) => {
    const { id: userId, role } = c.get("user");
    const { id } = c.req.valid("param");
    const { data } = c.req.valid("json");

    try {
      if (!isSelfOrAdmin({ userId, id, role })) {
        throw new AuthError(unauthorizedRes.message, FORBIDDEN);
      }

      const user = await userService.getByIdAndUpdate(id, data);

      wildCardDelCacheKey(USER_CACHE_PREFIX);

      return c.json(
        {
          success: true,
          message: "User updated successfully",
          data: { user },
        },
        OK
      );
    } catch (error) {
      if (error instanceof AuthError) {
        logger.warn(error.message, "Error updating user");
        return c.json(
          {
            success: false,
            message: error.message,
          },
          error.status
        );
      }

      logger.error(error, "Error updating user");

      return c.json(
        {
          success: false,
          message: "Error updating user",
        },
        INTERNAL_SERVER_ERROR
      );
    }
  }
);

app.delete("/:id", zValidator("param", GetUserByIdZodSchema), async (c) => {
  const { id } = c.req.valid("param");
  const { id: userId, role } = c.get("user");

  try {
    if (!isSelfOrAdmin({ userId, id, role })) {
      throw new AuthError(unauthorizedRes.message, FORBIDDEN);
    }

    const user = await userService.deleteUser(id);

    wildCardDelCacheKey(USER_CACHE_PREFIX);

    return c.json(
      {
        success: true,
        message: "Account deleted successfully",
        data: { user },
      },
      OK
    );
  } catch (error) {
    if (error instanceof AuthError) {
      logger.warn(error.message, "Error deleting user");
      return c.json(
        {
          success: false,
          message: error.message,
        },
        error.status
      );
    }

    logger.error(error, "Error deleting user");

    return c.json(
      {
        success: false,
        message: "Error deleting user",
      },
      INTERNAL_SERVER_ERROR
    );
  }
});

export default app;
