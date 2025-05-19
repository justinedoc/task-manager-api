import { deleteRefreshCookie } from "@/configs/cookie-config.js";
import { USER_CACHE_PREFIX } from "@/constants/cache-constants.js";
import { AuthError } from "@/errors/auth-error.js";
import {
  authMiddleware,
  isSelfOrAdmin,
} from "@/middlewares/auth-middleware.js";
import {
  GetUserByIdZodSchema,
  UpdateUserZodSchema,
  UserPasswordUpdateZodSchema,
} from "@/schemas/user-schema.js";
import userService from "@/services/user-service.js";
import type { AppBindings } from "@/types/hono-types.js";
import { getCacheKey, getCacheOrFetch } from "@/utils/get-cache.js";
import { wildCardDelCacheKey } from "@/utils/node-cache.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { FORBIDDEN, OK } from "stoker/http-status-codes";

export const unauthorizedRes = {
  success: false,
  message: "You are not allowed to perform this action",
};

const app = new Hono<AppBindings>().basePath("/user");

app.use(authMiddleware);

// get user by id
app.get("/:id", zValidator("param", GetUserByIdZodSchema), async (c) => {
  const { id } = c.req.valid("param");
  const { id: userId, role } = c.get("user");
  const cacheKey = getCacheKey("user", { userId });

  if (!isSelfOrAdmin({ userId, id, role })) {
    throw new AuthError(unauthorizedRes.message, FORBIDDEN);
  }

  const user = await getCacheOrFetch(
    cacheKey,
    async () => await userService.findById(userId)
  );

  return c.json(
    {
      success: true,
      message: "User fetched successfully",
      data: { user },
    },
    OK
  );
});

// update user password
app.patch(
  "/reset-password",
  zValidator("json", UserPasswordUpdateZodSchema),
  async (c) => {
    const { id: userId } = c.get("user");
    const { newPassword, oldPassword } = c.req.valid("json");

    const user = await userService.updatePassword(
      userId,
      newPassword,
      oldPassword
    );

    return c.json(
      {
        success: true,
        message: "Password reset successfully",
        data: { user },
      },
      OK
    );
  }
);

// update user
app.patch(
  "/:id",
  zValidator("param", UpdateUserZodSchema.pick({ id: true })),
  zValidator("json", UpdateUserZodSchema.shape.data),
  async (c) => {
    const { id: userId, role } = c.get("user");
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    if (!isSelfOrAdmin({ userId, id, role })) {
      throw new AuthError(unauthorizedRes.message, FORBIDDEN);
    }

    const user = await userService.update(id, data);

    wildCardDelCacheKey(USER_CACHE_PREFIX);

    return c.json(
      {
        success: true,
        message: "User updated successfully",
        data: { user },
      },
      OK
    );
  }
);

app.delete("/:id", zValidator("param", GetUserByIdZodSchema), async (c) => {
  const { id } = c.req.valid("param");
  const { id: userId, role } = c.get("user");

  if (!isSelfOrAdmin({ userId, id, role })) {
    throw new AuthError(unauthorizedRes.message, FORBIDDEN);
  }

  const user = await userService.delete(id);

  deleteRefreshCookie(c);

  wildCardDelCacheKey(USER_CACHE_PREFIX);

  return c.json(
    {
      success: true,
      message: "Account deleted successfully",
      data: { user },
    },
    OK
  );
});

export default app;
